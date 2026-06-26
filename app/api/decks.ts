import { http } from '@/utils/http';
import type { Card, Deck, DeckInput, DeckSummary } from '@/types/deck';

const LANG_NAME_MAP: Record<string, string> = {
    english: 'en',
    spanish: 'es',
    french: 'fr',
    german: 'de',
    italian: 'it',
    portuguese: 'pt',
    ukrainian: 'uk',
    polish: 'pl',
    japanese: 'ja',
    korean: 'ko',
    chinese: 'zh',
    russian: 'ru',
};

export const normLang = (raw: string): string => {
    if (!raw) {
        return '';
    }
    const lower = raw.toLowerCase();
    return LANG_NAME_MAP[lower] ?? lower;
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

export const listDecks = async (params: ListDecksParams = {}): Promise<ListDecksResult> => {
    const { cursor = null, limit = 20, q = '' } = params;
    const res = await http<ListDecksResult>('/decks', {
        query: { cursor: cursor ?? undefined, limit, q: q || undefined },
    });
    return {
        ...res,
        items: res.items.map((d) => ({
            ...d,
            sourceLanguage: normLang(d.sourceLanguage),
            targetLanguage: normLang(d.targetLanguage),
        })),
    };
};

export const getDeck = async (id: string): Promise<Deck> => {
    const res = await http<{ deck: DeckSummary; cards: Card[] }>(`/decks/${id}`);
    const { cardCount: _cardCount, ...deck } = res.deck;
    return {
        ...deck,
        sourceLanguage: normLang(deck.sourceLanguage),
        targetLanguage: normLang(deck.targetLanguage),
        cards: res.cards,
    };
};

export const createDeck = async (input: DeckInput): Promise<DeckSummary> => {
    const res = await http<DeckSummary>('/decks', {
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
    return {
        ...res,
        sourceLanguage: normLang(res.sourceLanguage),
        targetLanguage: normLang(res.targetLanguage),
    };
};

export const updateDeck = async (id: string, input: Partial<DeckInput>): Promise<DeckSummary> => {
    const res = await http<DeckSummary>(`/decks/${id}`, {
        method: 'PATCH',
        body: {
            ...input,
            ...(input.description !== undefined ? { description: input.description ?? '' } : {}),
        },
    });
    return {
        ...res,
        sourceLanguage: normLang(res.sourceLanguage),
        targetLanguage: normLang(res.targetLanguage),
    };
};

export const deleteDeck = async (id: string): Promise<void> => {
    await http<void>(`/decks/${id}`, { method: 'DELETE' });
};
