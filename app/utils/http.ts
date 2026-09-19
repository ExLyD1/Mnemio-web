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

/**
 * The browser's IANA time zone (e.g. "Europe/Kyiv"). Sent on every API call as
 * X-Timezone so the backend files study activity under the user's LOCAL day
 * and computes streaks / "days practiced" / daily charts in that zone.
 */
export const clientTimeZone = (): string | null => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    } catch {
        return null;
    }
};

let inflightRefresh: Promise<{ token: string | null; wasInvalid: boolean }> | null = null;

/**
 * Refresh the access token via the HttpOnly refresh cookie. A single refresh is
 * shared across concurrent callers. Exported so non-`http` callers (e.g. the SSE
 * chat stream, which uses native `fetch`) can reuse the same 401-recovery path.
 */
// `wasInvalid` distinguishes a genuinely dead session (server said
// AUTH_INVALID_REFRESH: the refresh token is missing/expired/revoked) from a
// transient failure (network blip, timeout, backend still booting) that
// merely prevented the refresh from completing this time. Callers must NOT
// treat the latter as a logout — see the call site below for why (BUG:
// re-opening the app on a flaky mobile connection could hard-log-out a user
// with a perfectly valid session, which reads to them as the app crashing).
export const refreshAccessToken = async (): Promise<{
    token: string | null;
    wasInvalid: boolean;
}> => {
    if (inflightRefresh) {
        return inflightRefresh;
    }
    // The token this tab was using when it hit the 401.
    const staleToken = readAccessToken();
    const doRefresh = async (): Promise<{ token: string | null; wasInvalid: boolean }> => {
        // Another tab may have refreshed while we waited for the lock — its new
        // token is already in shared storage, so reuse it instead of presenting
        // the (now rotated) refresh cookie a second time.
        const current = readAccessToken();
        if (current && current !== staleToken) {
            return { token: current, wasInvalid: false };
        }
        try {
            const data = await $fetch<RefreshResponse>(`${API_PREFIX}/auth/refresh`, {
                baseURL: apiBase,
                method: 'POST',
                credentials: 'include',
            });
            writeAccessToken(data.accessToken);
            return { token: data.accessToken, wasInvalid: false };
        } catch (err) {
            const normalized = normalizeError(err);
            const wasInvalid = normalized.code === 'AUTH_INVALID_REFRESH';
            if (wasInvalid) {
                writeAccessToken(null);
            }
            // Transient failure: keep whatever token is already stored (don't
            // wipe a still-possibly-valid session) and let the caller retry.
            return { token: null, wasInvalid };
        }
    };
    // Serialize refreshes ACROSS TABS (Web Locks API). When a laptop wakes up
    // or the phone is unlocked, every open tab hits a 401 at the same moment
    // and used to refresh with the same cookie simultaneously; the losers of
    // that race looked like refresh-token theft to the backend, which then
    // revoked the whole session ("logged out for no reason"). The backend now
    // also tolerates this (60s grace window), this just avoids the race.
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    inflightRefresh = (
        locks ? locks.request('mnemio-auth-refresh', doRefresh) : doRefresh()
    ).finally(() => {
        inflightRefresh = null;
    });
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
        const tz = clientTimeZone();
        if (tz) {
            headers['X-Timezone'] = tz;
        }
        if (!options.skipAuth) {
            const token = readAccessToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
        }
        return headers;
    };

    // Nitro types `$fetch` responses per route (TypedInternalResponse); for
    // these dynamic API paths that isn't assignable to T, so assert it.
    const send = () =>
        $fetch<T>(url, {
            baseURL,
            method: options.method ?? 'GET',
            body: options.body as Record<string, unknown> | undefined,
            query: options.query,
            headers: buildHeaders(),
            credentials: 'include',
        }) as Promise<T>;

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
            const { token: newToken, wasInvalid } = await refreshAccessToken();
            if (newToken) {
                try {
                    return await send();
                } catch (retryErr) {
                    const retryNormalized = normalizeError(retryErr);
                    // Only a 401 that names the token as the problem means the
                    // session is gone. A 401 for any other reason (a resource
                    // the user may not touch, a backend guard) must not wipe a
                    // session we just successfully refreshed a moment ago.
                    if (
                        (retryErr as { status?: number }).status === 401 &&
                        (retryNormalized.code === 'AUTH_INVALID_TOKEN' ||
                            retryNormalized.code === 'AUTH_INVALID_REFRESH')
                    ) {
                        onAuthFailure();
                    }
                    // http normalizes every failure to an ApiError object (the app's error
                    // contract — callers read .code/.message), not an Error instance.
                    // eslint-disable-next-line @typescript-eslint/only-throw-error
                    throw retryNormalized;
                }
            }
            // Only a confirmed-dead refresh token forces a logout. A transient
            // refresh failure (network/timeout/backend booting) must not log the
            // user out — surface the original 401 as a normal error instead so
            // the caller can retry, without wiping a session that may still be
            // perfectly valid.
            if (wasInvalid) {
                onAuthFailure();
            }
        }

        if (normalized.code === 'AUTH_INVALID_REFRESH') {
            onAuthFailure();
        }

        // Intentionally throws the normalized ApiError object (see note above).
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw normalized;
    }
};
