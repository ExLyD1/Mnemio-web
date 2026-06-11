import type { ApiError } from '@/composables/useAsync';
import { readAccessToken, writeAccessToken } from '@/utils/authToken';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface HttpOptions {
    method?: Method;
    body?: unknown;
    query?: Record<string, string | number | boolean | null | undefined>;
    headers?: Record<string, string>;
    skipAuth?: boolean;
    skipRefresh?: boolean;
}

const API_PREFIX = '/api/v1';

const isApiError = (e: unknown): e is ApiError =>
    !!e && typeof e === 'object' && 'code' in e && 'message' in e;

const normalizeError = (err: unknown): ApiError => {
    if (isApiError(err)) {
        return err;
    }
    const anyErr = err as { data?: unknown; message?: string; status?: number } | undefined;
    if (anyErr?.data && isApiError(anyErr.data)) {
        return anyErr.data;
    }
    if (anyErr?.data && typeof anyErr.data === 'object') {
        const d = anyErr.data as Record<string, unknown>;
        if (typeof d.code === 'string' && typeof d.message === 'string') {
            return {
                code: d.code,
                message: d.message,
                details: d.details as Record<string, unknown> | undefined,
            };
        }
    }
    const status = anyErr?.status ?? 0;
    if (status === 429) {
        return { code: 'RATE_LIMITED', message: 'Too many requests.' };
    }
    if (status === 401) {
        return { code: 'AUTH_UNAUTHENTICATED', message: 'Not signed in.' };
    }
    if (status === 403) {
        return { code: 'AUTH_FORBIDDEN', message: 'Not allowed.' };
    }
    if (status === 404) {
        return { code: 'NOT_FOUND', message: 'Not found.' };
    }
    return {
        code: 'NETWORK_ERROR',
        message: anyErr?.message ?? 'Network request failed.',
    };
};

interface RefreshResponse {
    accessToken: string;
}

// Resolved once from runtimeConfig by `plugins/00.api.ts`. Kept as a module
// value (not read via useRuntimeConfig here) so http() never calls a Nuxt
// composable — http runs inside async store actions, often after an `await`,
// where the Nuxt instance context is gone and composables would throw.
let apiBase = '';
export const setApiBase = (base: string): void => {
    apiBase = base;
};
/** The resolved API base URL (empty in dev → same-origin proxy). */
export const getApiBase = (): string => apiBase;

let inflightRefresh: Promise<string | null> | null = null;

/**
 * Refresh the access token via the HttpOnly refresh cookie. A single refresh is
 * shared across concurrent callers. Exported so non-`http` callers (e.g. the SSE
 * chat stream, which uses native `fetch`) can reuse the same 401-recovery path.
 */
export const refreshAccessToken = async (): Promise<string | null> => {
    if (inflightRefresh) {
        return inflightRefresh;
    }
    inflightRefresh = (async () => {
        try {
            const data = await $fetch<RefreshResponse>(`${API_PREFIX}/auth/refresh`, {
                baseURL: apiBase,
                method: 'POST',
                credentials: 'include',
            });
            writeAccessToken(data.accessToken);
            return data.accessToken;
        } catch {
            writeAccessToken(null);
            return null;
        } finally {
            inflightRefresh = null;
        }
    })();
    return inflightRefresh;
};

const onAuthFailure = (): void => {
    writeAccessToken(null);
    // Full-page redirect (no navigateTo) — context-free, safe to call anywhere.
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
    }
};

export const http = async <T>(path: string, options: HttpOptions = {}): Promise<T> => {
    const baseURL = apiBase;
    const url = path.startsWith('/api/') || path.startsWith('http') ? path : `${API_PREFIX}${path}`;

    const buildHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = { ...(options.headers ?? {}) };
        if (!options.skipAuth) {
            const token = readAccessToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
        }
        return headers;
    };

    const send = () =>
        $fetch<T>(url, {
            baseURL,
            method: options.method ?? 'GET',
            body: options.body as Record<string, unknown> | undefined,
            query: options.query,
            headers: buildHeaders(),
            credentials: 'include',
        });

    try {
        return await send();
    } catch (err) {
        const normalized = normalizeError(err);
        const status = (err as { status?: number }).status ?? 0;

        if (
            !options.skipAuth &&
            !options.skipRefresh &&
            status === 401 &&
            normalized.code !== 'AUTH_INVALID_REFRESH' &&
            url !== `${API_PREFIX}/auth/refresh`
        ) {
            const newToken = await refreshAccessToken();
            if (newToken) {
                try {
                    return await send();
                } catch (retryErr) {
                    const retryNormalized = normalizeError(retryErr);
                    if ((retryErr as { status?: number }).status === 401) {
                        onAuthFailure();
                    }
                    // http normalizes every failure to an ApiError object (the app's error
                    // contract — callers read .code/.message), not an Error instance.
                    // eslint-disable-next-line @typescript-eslint/only-throw-error
                    throw retryNormalized;
                }
            }
            onAuthFailure();
        }

        if (normalized.code === 'AUTH_INVALID_REFRESH') {
            onAuthFailure();
        }

        // Intentionally throws the normalized ApiError object (see note above).
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw normalized;
    }
};
