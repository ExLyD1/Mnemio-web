import { mockStore } from '@/services/mockStore';
import { mockCard } from '@/services/mock';
import type { Card, CardInput, Deck } from '@/types/deck';
import type { ApiError } from '@/composables/useAsync';

const key = (ownerId: string) => mockStore.userKey(ownerId, 'decks');

const err = (code: string, message: string): ApiError => ({ code, message });

const loadAll = (ownerId: string): Deck[] => mockStore.get<Deck[]>(key(ownerId)) ?? [];
const saveAll = (ownerId: string, decks: Deck[]) => mockStore.set(key(ownerId), decks);

const findDeck = (ownerId: string, deckId: string) => {
    const all = loadAll(ownerId);
    const idx = all.findIndex((d) => d.id === deckId);
    if (idx === -1) throw err('DECK_NOT_FOUND', 'Deck not found.');
    return { all, idx, deck: all[idx]! };
};

const touchDeck = (deck: Deck, cards: Card[]): Deck => ({
    ...deck,
    cards,
    updatedAt: new Date().toISOString(),
});

export const addCard = async (
    ownerId: string,
    deckId: string,
    input: CardInput,
): Promise<Card> => {
    const { all, idx, deck } = findDeck(ownerId, deckId);
    if (deck.cards.length >= 1000)
        throw err('CARD_LIMIT_REACHED', 'Maximum 1000 cards per deck.');
    const card = mockCard({
        deckId,
        word: input.word,
        definition: input.definition,
        phonetic: input.phonetic,
        position: deck.cards.length,
    });
    all[idx] = touchDeck(deck, [...deck.cards, card]);
    saveAll(ownerId, all);
    return card;
};

export const updateCard = async (
    ownerId: string,
    deckId: string,
    cardId: string,
    input: Partial<CardInput>,
): Promise<Card> => {
    const { all, idx, deck } = findDeck(ownerId, deckId);
    const cardIdx = deck.cards.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) throw err('CARD_NOT_FOUND', 'Card not found.');
    const updated: Card = {
        ...deck.cards[cardIdx]!,
        ...input,
        updatedAt: new Date().toISOString(),
    };
    const cards = [...deck.cards];
    cards[cardIdx] = updated;
    all[idx] = touchDeck(deck, cards);
    saveAll(ownerId, all);
    return updated;
};

export const deleteCard = async (
    ownerId: string,
    deckId: string,
    cardId: string,
): Promise<void> => {
    const { all, idx, deck } = findDeck(ownerId, deckId);
    const next = deck.cards.filter((c) => c.id !== cardId);
    if (next.length === deck.cards.length) throw err('CARD_NOT_FOUND', 'Card not found.');
    all[idx] = touchDeck(
        deck,
        next.map((c, i) => ({ ...c, position: i })),
    );
    saveAll(ownerId, all);
};

export interface ListCardsParams {
    cursor?: string | null;
    limit?: number;
}

export interface ListCardsResult {
    items: Card[];
    nextCursor: string | null;
    total: number;
}

const encodeCursor = (offset: number) =>
    typeof btoa !== 'undefined' ? btoa(`offset:${offset}`) : `offset:${offset}`;

const decodeCursor = (cursor: string | null): number => {
    if (!cursor) return 0;
    try {
        const decoded = typeof atob !== 'undefined' ? atob(cursor) : cursor;
        const m = /^offset:(\d+)$/.exec(decoded);
        return m ? Number(m[1]) : 0;
    } catch {
        return 0;
    }
};

export const listCards = async (
    ownerId: string,
    deckId: string,
    params: ListCardsParams = {},
): Promise<ListCardsResult> => {
    const { cursor = null, limit = 50 } = params;
    const { deck } = findDeck(ownerId, deckId);
    const sorted = [...deck.cards].sort((a, b) => a.position - b.position);
    const offset = decodeCursor(cursor);
    const slice = sorted.slice(offset, offset + limit);
    const nextOffset = offset + slice.length;
    const nextCursor = nextOffset < sorted.length ? encodeCursor(nextOffset) : null;
    return { items: slice, nextCursor, total: sorted.length };
};
