/**
 * Media (avatar / card image / audio) is served by the backend at its origin
 * (`:3001/media/...`) without the `/api/v1` prefix, while the app runs on a
 * different origin. The upload endpoint returns a relative path, so prefix it
 * with the API base for display.
 */
export const mediaUrl = (path: string | null | undefined): string | undefined => {
    if (!path) {
        return undefined;
    }
    if (/^https?:\/\//.test(path)) {
        return path;
    }
    const base = String(useRuntimeConfig().public.apiBase).replace(/\/$/, '');
    return `${base}${path}`;
};
