import { defineStore, ref } from '#imports';
import * as decksApi from '@/api/decks';
import * as cardsApi from '@/api/cards';
import type { Card, Deck, DeckInput, DeckSummary, CardInput } from '@/types/deck';

export const useDecksStore = defineStore('decks', () => {
    const summaries = ref<DeckSummary[]>([]);
    const deck = ref<Deck | null>(null);
    const total = ref(0);
    const nextCursor = ref<string | null>(null);
    const search = ref('');
    const loadingList = ref(false);
    const loadingDeck = ref(false);

    const byId = (id: string) => summaries.value.find((d) => d.id === id) ?? null;

    const fetchList = async (
        opts: { cursor?: string | null; q?: string; append?: boolean } = {},
    ) => {
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
        } finally {
            loadingList.value = false;
        }
    };

    const setSearch = async (q: string) => {
        search.value = q;
        await fetchList({ q, cursor: null, append: false });
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
        if (deck.value?.id === id) {
            deck.value = { ...deck.value, ...updated };
        }
        const idx = summaries.value.findIndex((d) => d.id === id);
        if (idx !== -1) {
            summaries.value[idx] = updated;
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
        const card = await cardsApi.addCard(deckId, input);
        if (deck.value?.id === deckId) {
            deck.value = { ...deck.value, cards: [...deck.value.cards, card] };
        }
        bumpCardCount(deckId, 1);
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
