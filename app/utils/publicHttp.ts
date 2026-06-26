import { useRuntimeConfig } from '#imports';

const API_PREFIX = '/api/v1';

interface PublicFetchOptions {
    query?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * No-auth, SSR-safe GET for public (crawler-facing) content. Unlike `utils/http.ts`
 * (which reads the access token from `localStorage` and only runs client-side), this
 * never attaches `Authorization` and resolves a base that works in both render passes:
 *
 *  - **server** → the backend origin directly (`runtimeConfig.apiProxyTarget`), since the
 *    same-origin `/api` dev/prod proxy is a browser-only route rule, not available to the
 *    Nitro server fetch.
 *  - **client** → relative (`runtimeConfig.public.apiBase`, empty in dev) so the request
 *    rides the same-origin proxy.
 *
 * Always call inside `useAsyncData(key, () => publicGet(...))` so the result is serialized
 * into the SSR payload and the HTML ships with content (don't fetch in `onMounted`).
 */
export const publicGet = <T>(path: string, options: PublicFetchOptions = {}): Promise<T> => {
    const config = useRuntimeConfig();
    const baseURL = import.meta.server ? config.apiProxyTarget : config.public.apiBase;
    const url = path.startsWith('/api/') || path.startsWith('http') ? path : `${API_PREFIX}${path}`;

    return $fetch<T>(url, {
        baseURL,
        method: 'GET',
        query: options.query,
    });
};
