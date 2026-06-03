import { http } from '@/utils/http';
import type { DeckSummary, DeckWithAuthor } from '@/types/deck';
import type { DiscoverCategory } from '@/types/discover';

export interface DiscoverParams {
    cursor?: string | null;
    q?: string;
    lang?: string;
    subject?: string;
    sort?: 'popular' | 'recent';
}

export const listDecks = (
    p: DiscoverParams = {},
): Promise<{ items: DeckWithAuthor[]; nextCursor: string | null; total: number }> =>
    http('/discover/decks', {
        query: {
            cursor: p.cursor ?? undefined,
            q: p.q,
            lang: p.lang,
            subject: p.subject,
            sort: p.sort,
        },
    });

export const getFeatured = (): Promise<{ items: DeckWithAuthor[] }> => http('/discover/featured');

export const getCategories = (): Promise<{ items: DiscoverCategory[] }> =>
    http('/discover/categories');

export const copyDeck = (deckId: string): Promise<DeckSummary> =>
    http(`/decks/${deckId}/copy`, { method: 'POST' });
