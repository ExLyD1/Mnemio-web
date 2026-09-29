import { defineStore, ref } from '#imports';
import * as decksApi from '@/api/decks';
import * as cardsApi from '@/api/cards';
import { useAchievementNotifications } from '@/composables/useAchievementNotifications';
import type { Card, Deck, DeckInput, DeckSummary, CardInput } from '@/types/deck';

export const useDecksStore = defineStore('decks', () => {
    const summaries = ref<DeckSummary[]>([]);
    const deck = ref<Deck | null>(null);
    const total = ref(0);
    const nextCursor = ref<string | null>(null);
    // Grabbed once at store setup (valid Vue/i18n context) and reused inside
    // `addCard()` after its await — see useAchievementNotifications.ts.
    const notifications = useAchievementNotifications();
    const search = ref('');
    const loadingList = ref(false);
    const loadingDeck = ref(false);

    const byId = (id: string) => summaries.value.find((d) => d.id === id) ?? null;

    // The deck list is requested by several independent components on one page
    // load (the page itself, the topbar, the rail). Each used to fire its own
    // identical GET /decks. Concurrent callers now share one request, and a
    // repeat within FRESH_MS reuses what we already have.
    const FRESH_MS = 30_000;
    let listFetchedAt = 0;
    let inflightList: Promise<void> | null = null;

    const fetchList = async (
        opts: { cursor?: string | null; q?: string; append?: boolean; force?: boolean } = {},
    ) => {
        const isFirstPage = !opts.append && !opts.cursor;
        const sameQuery = (opts.q ?? search.value) === search.value;
        if (
            isFirstPage &&
            sameQuery &&
            !opts.force &&
            summaries.value.length > 0 &&
            Date.now() - listFetchedAt < FRESH_MS
        ) {
            return;
        }
        if (isFirstPage && sameQuery && inflightList) {
            return inflightList;
        }

        const run = async () => {
            loadingList.value = true;
            try {
                const res = await decksApi.listDecks({
                    cursor: opts.cursor ?? null,
                    q: opts.q ?? search.value,
                    limit: 20,
                });
                summaries.value = opts.append ? [...summaries.value, ...res.items] : res.items;
                nextCursor.value = res.nextCursor;
                total.value = res.total;
                if (isFirstPage) {
                    listFetchedAt = Date.now();
                }
            } finally {
                loadingList.value = false;
            }
        };

        if (!isFirstPage || !sameQuery) {
            await run();
            return;
        }
        inflightList = run().finally(() => {
            inflightList = null;
        });
        return inflightList;
    };

    const setSearch = async (q: string) => {
        search.value = q;
        await fetchList({ q, cursor: null, append: false, force: true });
    };

    const loadMore = async () => {
        if (!nextCursor.value) {
            return;
        }
        await fetchList({ cursor: nextCursor.value, append: true });
    };

    // Monotonic token so out-of-order responses can't clobber a newer fetch.
    let fetchSeq = 0;
    const fetchOne = async (id: string) => {
        const seq = ++fetchSeq;
        loadingDeck.value = true;
        // Never render a previously-loaded *different* deck while the new one
        // loads — drop it so the page falls back to its loader, not stale data.
        if (deck.value && deck.value.id !== id) {
            deck.value = null;
        }
        try {
            const result = await decksApi.getDeck(id);
            if (seq === fetchSeq) {
                deck.value = result;
            }
            return result;
        } finally {
            if (seq === fetchSeq) {
                loadingDeck.value = false;
            }
        }
    };

    const create = async (input: DeckInput) => {
        const created = await decksApi.createDeck(input);
        await fetchList({ cursor: null, append: false });
        return created;
    };

    const update = async (id: string, input: Partial<DeckInput>) => {
        const updated = await decksApi.updateDeck(id, input);
        // PATCH /decks/:id returns the deck without viewer-scoped stats, so its
        // `stats` is always zeroed. Spreading that over a loaded deck made
        // renaming a deck instantly show 0% mastered and an all-grey progress
        // bar until the next refetch. Keep the stats we already have.
        const keepStats = <T extends { stats?: unknown }>(prev: T, next: T): T => ({
            ...next,
            stats: prev.stats ?? next.stats,
        });
        if (deck.value?.id === id) {
            deck.value = keepStats(deck.value, { ...deck.value, ...updated });
        }
        const idx = summaries.value.findIndex((d) => d.id === id);
        const prev = idx === -1 ? undefined : summaries.value[idx];
        if (idx !== -1 && prev) {
            summaries.value[idx] = keepStats(prev, updated);
        }
        return updated;
    };

    const remove = async (id: string) => {
        await decksApi.deleteDeck(id);
        summaries.value = summaries.value.filter((d) => d.id !== id);
        total.value = Math.max(0, total.value - 1);
        if (deck.value?.id === id) {
            deck.value = null;
        }
    };

    const bumpCardCount = (deckId: string, delta: number) => {
        const idx = summaries.value.findIndex((d) => d.id === deckId);
        const cur = idx !== -1 ? summaries.value[idx] : undefined;
        if (cur) {
            summaries.value[idx] = { ...cur, cardCount: Math.max(0, cur.cardCount + delta) };
        }
    };

    const addCard = async (deckId: string, input: CardInput): Promise<Card> => {
        const { newAchievements, ...card } = await cardsApi.addCard(deckId, input);
        if (deck.value?.id === deckId) {
            deck.value = { ...deck.value, cards: [...deck.value.cards, card] };
        }
        bumpCardCount(deckId, 1);
        notifications.announce(newAchievements);
        return card;
    };

    const updateCard = async (
        deckId: string,
        cardId: string,
        input: Partial<CardInput>,
    ): Promise<Card> => {
        const updated = await cardsApi.updateCard(cardId, input);
        if (deck.value?.id === deckId) {
            deck.value = {
                ...deck.value,
                cards: deck.value.cards.map((c) => (c.id === cardId ? updated : c)),
            };
        }
        return updated;
    };

    const deleteCard = async (deckId: string, cardId: string): Promise<void> => {
        await cardsApi.deleteCard(cardId);
        if (deck.value?.id === deckId) {
            deck.value = {
                ...deck.value,
                cards: deck.value.cards.filter((c) => c.id !== cardId),
            };
        }
        bumpCardCount(deckId, -1);
    };

    const reset = () => {
        summaries.value = [];
        deck.value = null;
        total.value = 0;
        nextCursor.value = null;
        search.value = '';
        // Otherwise the next user's first load would be served from the
        // previous user's freshness window.
        listFetchedAt = 0;
    };

    return {
        summaries,
        deck,
        total,
        nextCursor,
        search,
        loadingList,
        loadingDeck,
        byId,
        fetchList,
        setSearch,
        loadMore,
        fetchOne,
        create,
        update,
        remove,
        addCard,
        updateCard,
        deleteCard,
        reset,
    };
});
