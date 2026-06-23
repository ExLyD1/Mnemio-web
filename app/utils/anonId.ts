const ANON_ID_KEY = 'mnemio:anon_id';

/**
 * Stable per-browser anonymous id. Generated once and persisted in localStorage so
 * it survives reloads and days — unlike a session-scoped id that could differ day
 * to day. Attached to every Mixpanel event as the `anonymous_id` super-property, so
 * a visitor's events stay tied to one identity before (and after) they sign in.
 *
 * Returns '' when storage/crypto is unavailable (SSR, privacy mode) — callers skip
 * registering it in that case.
 */
export const getAnonId = (): string => {
    if (typeof window === 'undefined') {
        return '';
    }
    try {
        let id = window.localStorage.getItem(ANON_ID_KEY);
        if (!id) {
            id =
                typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                    ? crypto.randomUUID()
                    : `anon-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
            window.localStorage.setItem(ANON_ID_KEY, id);
        }
        return id;
    } catch {
        return '';
    }
};
