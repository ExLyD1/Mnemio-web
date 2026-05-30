const KEY = 'mnemio:auth:accessToken';

export const readAccessToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(KEY);
};

export const writeAccessToken = (token: string | null): void => {
    if (typeof window === 'undefined') return;
    if (token) window.localStorage.setItem(KEY, token);
    else window.localStorage.removeItem(KEY);
};
