import { defineStore, ref, computed } from '#imports';
import * as decksApi from '@/api/decks';
import * as cardsApi from '@/api/cards';
import { useAuthStore } from '@/stores/auth';
import type { Card, Deck, DeckInput, DeckSummary, CardInput } from '@/types/deck';

export const useDecksStore = defineStore('decks', () => {
    const summaries = ref<DeckSummary[]>([]);
    const deck = ref<Deck | null>(null);
    const total = ref(0);
    const nextCursor = ref<string | null>(null);
    const search = ref('');
    const loadingList = ref(false);
    const loadingDeck = ref(false);

    const auth = useAuthStore();
    const ownerId = computed(() => auth.currentUser?.id ?? null);

    const requireOwner = (): string => {
        const id = ownerId.value;
        if (!id) throw { code: 'AUTH_NOT_AUTHENTICATED', message: 'Not signed in.' };
        return id;
    };

    const byId = (id: string) => summaries.value.find((d) => d.id === id) ?? null;

    const fetchList = async (opts: { cursor?: string | null; q?: string; append?: boolean } = {}) => {
        const owner = requireOwner();
        loadingList.value = true;
        try {
            const res = await decksApi.listDecks(owner, {
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
        if (!nextCursor.value) return;
        await fetchList({ cursor: nextCursor.value, append: true });
    };

    const fetchOne = async (id: string) => {
        const owner = requireOwner();
        loadingDeck.value = true;
        try {
            deck.value = await decksApi.getDeck(owner, id);
            return deck.value;
        } finally {
            loadingDeck.value = false;
        }
    };

    const create = async (input: DeckInput) => {
        const owner = requireOwner();
        const created = await decksApi.createDeck(owner, input);
        await fetchList({ cursor: null, append: false });
        return created;
    };

    const update = async (id: string, input: Partial<DeckInput>) => {
        const owner = requireOwner();
        const updated = await decksApi.updateDeck(owner, id, input);
        if (deck.value?.id === id) deck.value = { ...deck.value, ...updated };
        const idx = summaries.value.findIndex((d) => d.id === id);
        if (idx !== -1) {
            const { cards, ...rest } = updated;
            summaries.value[idx] = { ...rest, cardCount: cards.length };
        }
        return updated;
    };

    const remove = async (id: string) => {
        const owner = requireOwner();
        await decksApi.deleteDeck(owner, id);
        summaries.value = summaries.value.filter((d) => d.id !== id);
        total.value = Math.max(0, total.value - 1);
        if (deck.value?.id === id) deck.value = null;
    };

    const addCard = async (deckId: string, input: CardInput): Promise<Card> => {
        const owner = requireOwner();
        const card = await cardsApi.addCard(owner, deckId, input);
        if (deck.value?.id === deckId) {
            deck.value = { ...deck.value, cards: [...deck.value.cards, card] };
        }
        const idx = summaries.value.findIndex((d) => d.id === deckId);
        if (idx !== -1) summaries.value[idx] = { ...summaries.value[idx]!, cardCount: summaries.value[idx]!.cardCount + 1 };
        return card;
    };

    const updateCard = async (
        deckId: string,
        cardId: string,
        input: Partial<CardInput>,
    ): Promise<Card> => {
        const owner = requireOwner();
        const updated = await cardsApi.updateCard(owner, deckId, cardId, input);
        if (deck.value?.id === deckId) {
            deck.value = {
                ...deck.value,
                cards: deck.value.cards.map((c) => (c.id === cardId ? updated : c)),
            };
        }
        return updated;
    };

    const deleteCard = async (deckId: string, cardId: string): Promise<void> => {
        const owner = requireOwner();
        await cardsApi.deleteCard(owner, deckId, cardId);
        if (deck.value?.id === deckId) {
            deck.value = {
                ...deck.value,
                cards: deck.value.cards.filter((c) => c.id !== cardId),
            };
        }
        const idx = summaries.value.findIndex((d) => d.id === deckId);
        if (idx !== -1)
            summaries.value[idx] = {
                ...summaries.value[idx]!,
                cardCount: Math.max(0, summaries.value[idx]!.cardCount - 1),
            };
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
