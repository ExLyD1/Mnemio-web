import { http } from '@/utils/http';
import { normLang } from '@/api/decks';
import type { DeckSummary, DeckWithAuthor } from '@/types/deck';
import type { DiscoverCategory } from '@/types/discover';

export interface DiscoverParams {
    cursor?: string | null;
    q?: string;
    lang?: string;
    subject?: string;
    sort?: 'popular' | 'recent';
}

const normDeck = (d: DeckWithAuthor): DeckWithAuthor => ({
    ...d,
    sourceLanguage: normLang(d.sourceLanguage),
    targetLanguage: normLang(d.targetLanguage),
});

export const listDecks = async (
    p: DiscoverParams = {},
): Promise<{ items: DeckWithAuthor[]; nextCursor: string | null; total: number }> => {
    const res = await http<{ items: DeckWithAuthor[]; nextCursor: string | null; total: number }>(
        '/discover/decks',
        {
            query: {
                cursor: p.cursor ?? undefined,
                q: p.q,
                lang: p.lang,
                subject: p.subject,
                sort: p.sort,
            },
        },
    );
    return { ...res, items: res.items.map(normDeck) };
};

export const getFeatured = async (): Promise<{ items: DeckWithAuthor[] }> => {
    const res = await http<{ items: DeckWithAuthor[] }>('/discover/featured');
    return { items: res.items.map(normDeck) };
};

export const getCategories = (): Promise<{ items: DiscoverCategory[] }> =>
    http('/discover/categories');

export const copyDeck = async (deckId: string): Promise<DeckSummary> => {
    const res = await http<DeckSummary>(`/decks/${deckId}/copy`, { method: 'POST' });
    return {
        ...res,
        sourceLanguage: normLang(res.sourceLanguage),
        targetLanguage: normLang(res.targetLanguage),
    };
};
