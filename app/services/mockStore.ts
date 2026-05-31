const MOCK_SCHEMA_VERSION = 1;
const SCHEMA_KEY = 'mnemio:schema_version';
const PREFIX = 'mnemio:';

const isClient = () => typeof window !== 'undefined';

const ensureSchema = () => {
    if (!isClient()) return;
    const stored = window.localStorage.getItem(SCHEMA_KEY);
    if (stored === String(MOCK_SCHEMA_VERSION)) return;

    for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(PREFIX)) window.localStorage.removeItem(k);
    }
    window.localStorage.setItem(SCHEMA_KEY, String(MOCK_SCHEMA_VERSION));
    console.warn('[mockStore] schema mismatch — local data cleared');
};

export const mockStore = {
    get<T>(key: string): T | null {
        if (!isClient()) return null;
        ensureSchema();
        const raw = window.localStorage.getItem(PREFIX + key);
        if (raw === null) return null;
        try {
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    },

    set<T>(key: string, value: T): void {
        if (!isClient()) return;
        ensureSchema();
        window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    },

    remove(key: string): void {
        if (!isClient()) return;
        window.localStorage.removeItem(PREFIX + key);
    },

    userKey(userId: string, resource: string): string {
        return `v${MOCK_SCHEMA_VERSION}:${userId}:${resource}`;
    },
};
