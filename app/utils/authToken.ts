const KEY = 'mnemio:auth:accessToken';

let storage: Storage | null = null;

const getStorage = (): Storage => {
    if (storage) {
        return storage;
    }
    if (typeof window !== 'undefined') {
        storage = window.localStorage;
    }
    return window.localStorage;
};

export const setRemember = (remember: boolean): void => {
    if (typeof window === 'undefined') {
        return;
    }
    const token = getStorage().getItem(KEY);
    storage = remember ? window.localStorage : window.sessionStorage;
    if (token) {
        storage.setItem(KEY, token);
    }
    if (!remember) {
        window.localStorage.removeItem(KEY);
    }
};

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
