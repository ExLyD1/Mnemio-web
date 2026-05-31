import { mockStore } from '@/services/mockStore';
import { mockDeck } from '@/services/mock';
import type { Deck, DeckInput, DeckSummary } from '@/types/deck';
import type { ApiError } from '@/composables/useAsync';

const key = (ownerId: string) => mockStore.userKey(ownerId, 'decks');

const err = (code: string, message: string): ApiError => ({ code, message });

const loadAll = (ownerId: string): Deck[] => mockStore.get<Deck[]>(key(ownerId)) ?? [];
const saveAll = (ownerId: string, decks: Deck[]) => mockStore.set(key(ownerId), decks);

const toSummary = (d: Deck): DeckSummary => {
    const { cards, ...rest } = d;
    return { ...rest, cardCount: cards.length };
};

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

export interface ListDecksParams {
    cursor?: string | null;
    limit?: number;
    q?: string;
}

export interface ListDecksResult {
    items: DeckSummary[];
    nextCursor: string | null;
    total: number;
}

export const listDecks = async (
    ownerId: string,
    params: ListDecksParams = {},
): Promise<ListDecksResult> => {
    const { cursor = null, limit = 20, q = '' } = params;
    const all = loadAll(ownerId).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    const term = q.trim().toLowerCase();
    const filtered = term
        ? all.filter(
              (d) =>
                  d.title.toLowerCase().includes(term) ||
                  (d.description ?? '').toLowerCase().includes(term),
          )
        : all;
    const offset = decodeCursor(cursor);
    const slice = filtered.slice(offset, offset + limit);
    const nextOffset = offset + slice.length;
    const nextCursor = nextOffset < filtered.length ? encodeCursor(nextOffset) : null;
    return { items: slice.map(toSummary), nextCursor, total: filtered.length };
};

export const getDeck = async (ownerId: string, id: string): Promise<Deck> => {
    const all = loadAll(ownerId);
    const found = all.find((d) => d.id === id);
    if (!found) throw err('DECK_NOT_FOUND', 'Deck not found.');
    return found;
};

export const createDeck = async (ownerId: string, input: DeckInput): Promise<Deck> => {
    const all = loadAll(ownerId);
    if (all.length >= 200) throw err('DECK_LIMIT_REACHED', 'Maximum 200 decks per user.');
    const deck = mockDeck({
        ownerId,
        title: input.title,
        description: input.description,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
    });
    saveAll(ownerId, [deck, ...all]);
    return deck;
};

export const updateDeck = async (
    ownerId: string,
    id: string,
    input: Partial<DeckInput>,
): Promise<Deck> => {
    const all = loadAll(ownerId);
    const idx = all.findIndex((d) => d.id === id);
    if (idx === -1) throw err('DECK_NOT_FOUND', 'Deck not found.');
    const updated: Deck = {
        ...all[idx]!,
        ...input,
        updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    saveAll(ownerId, all);
    return updated;
};

export const deleteDeck = async (ownerId: string, id: string): Promise<void> => {
    const all = loadAll(ownerId);
    const next = all.filter((d) => d.id !== id);
    if (next.length === all.length) throw err('DECK_NOT_FOUND', 'Deck not found.');
    saveAll(ownerId, next);
};
