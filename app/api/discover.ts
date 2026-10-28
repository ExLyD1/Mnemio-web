import { http } from '@/utils/http';
import { normLang } from '@/api/decks';
import type { DeckSummary, DeckWithAuthor } from '@/types/deck';
import type { DiscoverCategories } from '@/types/discover';
import type { Subject } from '@/utils/subjects';

export interface DiscoverParams {
    cursor?: string | null;
    q?: string;
    /** ISO 639-1; matches the deck's targetLanguage. */
    lang?: string;
    subject?: Subject;
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

export const getCategories = async (): Promise<DiscoverCategories> => {
    const res = await http<Partial<DiscoverCategories>>('/discover/categories');
    return { items: res.items ?? [], languages: res.languages ?? [] };
};

export const copyDeck = async (deckId: string): Promise<DeckSummary> => {
    const res = await http<DeckSummary>(`/decks/${deckId}/copy`, { method: 'POST' });
    return {
        ...res,
        sourceLanguage: normLang(res.sourceLanguage),
        targetLanguage: normLang(res.targetLanguage),
    };
};
