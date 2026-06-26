const KEY = 'mnemio:returnTo';
const DEFAULT = '/dashboard';

/**
 * Sanitize a post-login redirect target. Only internal absolute paths are allowed
 * (must start with a single '/') — this blocks open-redirects to '//evil.com' or
 * absolute URLs. Returns '' when the value is unsafe/absent.
 */
export const sanitizeNext = (value: unknown): string => {
    if (typeof value !== 'string') {
        return '';
    }
    if (!value.startsWith('/') || value.startsWith('//')) {
        return '';
    }
    return value;
};

/**
 * Remember where the user was headed before they were bounced to /login, so we can
 * send them back after auth. Stored in sessionStorage so it survives the OAuth
 * provider round-trip (which drops query params).
 */
export const rememberReturnTo = (value: unknown): void => {
    if (typeof window === 'undefined') {
        return;
    }
    const next = sanitizeNext(value);
    try {
        if (next) {
            window.sessionStorage.setItem(KEY, next);
        } else {
            // No (valid) target this time — clear any stale value so a later login
            // without ?next doesn't redirect to an old destination.
            window.sessionStorage.removeItem(KEY);
        }
    } catch {
        /* storage unavailable */
    }
};

/**
 * Consume the remembered destination (clearing it), falling back to /dashboard.
 */
export const takeReturnTo = (): string => {
    if (typeof window === 'undefined') {
        return DEFAULT;
    }
    try {
        const stored = window.sessionStorage.getItem(KEY);
        window.sessionStorage.removeItem(KEY);
        return sanitizeNext(stored) || DEFAULT;
    } catch {
        return DEFAULT;
    }
};
