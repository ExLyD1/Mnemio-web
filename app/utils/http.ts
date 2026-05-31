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
    if (isApiError(err)) return err;
    const anyErr = err as { data?: unknown; message?: string; status?: number };
    if (anyErr?.data && isApiError(anyErr.data)) return anyErr.data;
    if (anyErr?.data && typeof anyErr.data === 'object') {
        const d = anyErr.data as Record<string, unknown>;
        if (typeof d.code === 'string' && typeof d.message === 'string') {
            return { code: d.code, message: d.message, details: d.details as Record<string, unknown> | undefined };
        }
    }
    const status = anyErr?.status ?? 0;
    if (status === 429) return { code: 'RATE_LIMITED', message: 'Too many requests.' };
    if (status === 401) return { code: 'AUTH_UNAUTHENTICATED', message: 'Not signed in.' };
    if (status === 403) return { code: 'AUTH_FORBIDDEN', message: 'Not allowed.' };
    if (status === 404) return { code: 'NOT_FOUND', message: 'Not found.' };
    return {
        code: 'NETWORK_ERROR',
        message: anyErr?.message ?? 'Network request failed.',
    };
};

interface RefreshResponse {
    accessToken: string;
}

let inflightRefresh: Promise<string | null> | null = null;

const refreshAccessToken = async (baseURL: string): Promise<string | null> => {
    if (inflightRefresh) return inflightRefresh;
    inflightRefresh = (async () => {
        try {
            const data = await $fetch<RefreshResponse>(`${API_PREFIX}/auth/refresh`, {
                baseURL,
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

const onAuthFailure = async () => {
    writeAccessToken(null);
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        await navigateTo('/login');
    }
};

export const http = async <T>(path: string, options: HttpOptions = {}): Promise<T> => {
    const config = useRuntimeConfig();
    const baseURL = config.public.apiBase as string;
    const url = path.startsWith('/api/') || path.startsWith('http') ? path : `${API_PREFIX}${path}`;

    const buildHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = { ...(options.headers ?? {}) };
        if (!options.skipAuth) {
            const token = readAccessToken();
            if (token) headers.Authorization = `Bearer ${token}`;
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
        const status = (err as { status?: number })?.status ?? 0;

        if (
            !options.skipAuth &&
            !options.skipRefresh &&
            status === 401 &&
            normalized.code !== 'AUTH_INVALID_REFRESH' &&
            url !== `${API_PREFIX}/auth/refresh`
        ) {
            const newToken = await refreshAccessToken(baseURL);
            if (newToken) {
                try {
                    return await send();
                } catch (retryErr) {
                    const retryNormalized = normalizeError(retryErr);
                    if ((retryErr as { status?: number })?.status === 401) {
                        await onAuthFailure();
                    }
                    throw retryNormalized;
                }
            }
            await onAuthFailure();
        }

        if (normalized.code === 'AUTH_INVALID_REFRESH') {
            await onAuthFailure();
        }

        throw normalized;
    }
};
