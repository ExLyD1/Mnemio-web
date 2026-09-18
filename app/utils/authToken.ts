const KEY = 'mnemio:auth:accessToken';
// Persisted "Remember me" choice. '0' = session-only (token in sessionStorage);
// absent = remembered (token in localStorage). Before this was persisted, the
// choice lived only in a module variable, so after any page reload the token
// was looked up in localStorage — where a session-only login never put it —
// and the user was logged out on reload.
const REMEMBER_KEY = 'mnemio:auth:remember';

let storage: Storage | null = null;

const isSessionOnly = (): boolean => {
    try {
        return window.localStorage.getItem(REMEMBER_KEY) === '0';
    } catch {
        return false;
    }
};

const getStorage = (): Storage => {
    if (storage) {
        return storage;
    }
    storage = isSessionOnly() ? window.sessionStorage : window.localStorage;
    return storage;
};

export const setRemember = (remember: boolean): void => {
    if (typeof window === 'undefined') {
        return;
    }
    const token = getStorage().getItem(KEY);
    if (remember) {
        window.localStorage.removeItem(REMEMBER_KEY);
    } else {
        window.localStorage.setItem(REMEMBER_KEY, '0');
    }
    storage = remember ? window.localStorage : window.sessionStorage;
    if (token) {
        storage.setItem(KEY, token);
    }
    if (!remember) {
        window.localStorage.removeItem(KEY);
    }
};

/**
 * Whether a missing access token may be recovered from the HttpOnly refresh
 * cookie on boot. False for "don't remember me" logins, so closing the browser
 * still signs the user out as they asked.
 */
export const canRestoreFromCookie = (): boolean =>
    typeof window !== 'undefined' && !isSessionOnly();

export const readAccessToken = (): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    return getStorage().getItem(KEY);
};

export const writeAccessToken = (token: string | null): void => {
    if (typeof window === 'undefined') {
        return;
    }
    if (token) {
        getStorage().setItem(KEY, token);
    } else {
        getStorage().removeItem(KEY);
        window.localStorage.removeItem(KEY);
        window.sessionStorage.removeItem(KEY);
    }
};
