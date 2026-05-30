import type { ApiError } from '@/composables/useAsync';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface HttpOptions {
    method?: Method;
    body?: unknown;
    query?: Record<string, string | number | boolean | null | undefined>;
    headers?: Record<string, string>;
    accessToken?: string | null;
}

const isApiError = (e: unknown): e is ApiError =>
    !!e && typeof e === 'object' && 'code' in e && 'message' in e;

const normalizeError = (err: unknown): ApiError => {
    if (isApiError(err)) return err;
    const anyErr = err as { data?: unknown; message?: string; status?: number };
    if (anyErr?.data && isApiError(anyErr.data)) return anyErr.data;
    if (anyErr?.data && typeof anyErr.data === 'object') {
        const d = anyErr.data as Record<string, unknown>;
        if (typeof d.code === 'string' && typeof d.message === 'string') {
            return { code: d.code, message: d.message };
        }
    }
    const status = anyErr?.status ?? 0;
    if (status === 401) return { code: 'AUTH_UNAUTHENTICATED', message: 'Not signed in.' };
    if (status === 403) return { code: 'AUTH_FORBIDDEN', message: 'Not allowed.' };
    if (status === 404) return { code: 'NOT_FOUND', message: 'Not found.' };
    if (status === 429) return { code: 'RATE_LIMITED', message: 'Too many requests.' };
    return {
        code: 'NETWORK_ERROR',
        message: anyErr?.message ?? 'Network request failed.',
    };
};

export const http = async <T>(path: string, options: HttpOptions = {}): Promise<T> => {
    const config = useRuntimeConfig();
    const base = config.public.apiBase as string;
    const headers: Record<string, string> = { ...(options.headers ?? {}) };
    if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

    try {
        return await $fetch<T>(path, {
            baseURL: base,
            method: options.method ?? 'GET',
            body: options.body as Record<string, unknown> | undefined,
            query: options.query,
            headers,
            credentials: 'include',
        });
    } catch (err) {
        throw normalizeError(err);
    }
};
