/**
 * Tiny in-memory TTL+LRU cache shared by the lexicon routes (complete.get.ts,
 * translate.get.ts). Single-process and lost on deploy/restart — acceptable
 * for a suggestion cache whose only job is to avoid repeating the same
 * single-word lookup against a third party within a day.
 */
export const makeCache = (maxEntries: number, ttlMs: number) => {
    const store = new Map<string, { at: number; items: string[] }>();

    const get = (key: string): string[] | null => {
        const hit = store.get(key);
        if (!hit) {
            return null;
        }
        if (Date.now() - hit.at > ttlMs) {
            store.delete(key);
            return null;
        }
        // Touch for LRU: delete + re-set moves it to the end of insertion order.
        store.delete(key);
        store.set(key, hit);
        return hit.items;
    };

    const set = (key: string, items: string[]): void => {
        if (store.size >= maxEntries) {
            const oldest = store.keys().next().value;
            if (oldest !== undefined) {
                store.delete(oldest);
            }
        }
        store.set(key, { at: Date.now(), items });
    };

    return { get, set };
};
