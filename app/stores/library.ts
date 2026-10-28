import { defineStore, ref } from '#imports';
import * as libraryApi from '@/api/library';
import type { LibraryDeck, LibraryFacets, LibraryScope } from '@/api/library';
import type { Subject } from '@/utils/subjects';

export interface LibraryFilters {
    scope: LibraryScope;
    subject: Subject | null;
    /** Only meaningful with subject 'languages'. */
    lang: string | null;
}

/**
 * GET /library state. Two views:
 *  - the library page's filtered, paged list (`items`, `facets`, `filters`);
 *  - `allDecks`: the first 50 of scope=all, for the dashboard and the Topbar
 *    search, cached for FRESH_MS and dropped by `invalidate()`.
 * The decks store, the imports store and session complete call `invalidate()`.
 */
export const useLibraryStore = defineStore('library', () => {
    const items = ref<LibraryDeck[]>([]);
    const nextCursor = ref<string | null>(null);
    const total = ref(0);
    const facets = ref<LibraryFacets | null>(null);
    const filters = ref<LibraryFilters>({ scope: 'all', subject: null, lang: null });

    const allDecks = ref<LibraryDeck[]>([]);
    const FRESH_MS = 30_000;
    let allFetchedAt = 0;
    let inflightAll: Promise<void> | null = null;

    const query = () => ({
        scope: filters.value.scope,
        subject: filters.value.subject ?? undefined,
        lang: filters.value.subject === 'languages' ? (filters.value.lang ?? undefined) : undefined,
    });

    // Drops responses that a newer filter change has superseded.
    let seq = 0;

    /** First page for `next` (or the current filters); replaces the list. */
    const fetch = async (next?: LibraryFilters) => {
        if (next) {
            filters.value = { ...next };
        }
        const mine = ++seq;
        const page = await libraryApi.listLibrary(query());
        if (mine !== seq) {
            return;
        }
        items.value = page.items;
        nextCursor.value = page.nextCursor;
        total.value = page.total;
        facets.value = page.facets ?? null;
    };

    const loadMore = async () => {
        if (!nextCursor.value) {
            return;
        }
        const mine = seq;
        const page = await libraryApi.listLibrary({ ...query(), cursor: nextCursor.value });
        if (mine !== seq) {
            return;
        }
        const seen = new Set(items.value.map((d) => d.id));
        items.value = [...items.value, ...page.items.filter((d) => !seen.has(d.id))];
        nextCursor.value = page.nextCursor;
        total.value = page.total;
    };

    const fetchAll = async (opts: { force?: boolean } = {}) => {
        if (!opts.force && allFetchedAt && Date.now() - allFetchedAt < FRESH_MS) {
            return;
        }
        inflightAll ??= libraryApi
            .listLibrary({ scope: 'all', limit: 50 })
            .then((page) => {
                allDecks.value = page.items;
                allFetchedAt = Date.now();
            })
            .finally(() => {
                inflightAll = null;
            });
        await inflightAll;
    };

    const invalidate = () => {
        allFetchedAt = 0;
    };

    return {
        items,
        nextCursor,
        total,
        facets,
        filters,
        allDecks,
        fetch,
        loadMore,
        fetchAll,
        invalidate,
    };
});
