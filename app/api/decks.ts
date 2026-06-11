import { http } from '@/utils/http';
import type { Card, Deck, DeckInput, DeckSummary } from '@/types/deck';

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

export const listDecks = async (params: ListDecksParams = {}): Promise<ListDecksResult> => {
    const { cursor = null, limit = 20, q = '' } = params;
    return http<ListDecksResult>('/decks', {
        query: { cursor: cursor ?? undefined, limit, q: q || undefined },
    });
};

export const getDeck = async (id: string): Promise<Deck> => {
    const res = await http<{ deck: DeckSummary; cards: Card[] }>(`/decks/${id}`);
    const { cardCount: _cardCount, ...deck } = res.deck;
    return { ...deck, cards: res.cards };
};

export const createDeck = async (input: DeckInput): Promise<DeckSummary> =>
    http<DeckSummary>('/decks', {
        method: 'POST',
        body: {
            title: input.title,
            description: input.description ?? '',
            sourceLanguage: input.sourceLanguage,
            targetLanguage: input.targetLanguage,
            // New decks are public by default; callers (the create form) can override.
            isPublic: input.isPublic ?? true,
            ...(input.coverColor !== undefined ? { coverColor: input.coverColor } : {}),
            ...(input.glyph !== undefined ? { glyph: input.glyph } : {}),
            ...(input.subject !== undefined ? { subject: input.subject } : {}),
        },
    });

export const updateDeck = async (id: string, input: Partial<DeckInput>): Promise<DeckSummary> =>
    http<DeckSummary>(`/decks/${id}`, { method: 'PATCH', body: input });

export const deleteDeck = async (id: string): Promise<void> => {
    await http<void>(`/decks/${id}`, { method: 'DELETE' });
};
