import { publicGet } from '@/utils/publicHttp';
import type { Card, DeckWithAuthor } from '@/types/deck';
import type { DiscoverCategories } from '@/types/discover';
import type { Subject } from '@/utils/subjects';

export interface PublicDiscoverParams {
    cursor?: string | null;
    q?: string;
    /** ISO 639-1; matches the deck's targetLanguage. */
    lang?: string;
    subject?: Subject;
    sort?: 'popular' | 'recent';
}

/** A public deck page needs the cards inline so the HTML has real, indexable content. */
export type PublicDeckDetail = DeckWithAuthor & { cards: Card[] };

/**
 * No-auth read API mirroring `api/discover.ts`, used by the SSR public pages under
 * `/discover/**`. Backed by the backend's `/public/*` endpoints (see docs/api-contract.md —
 * "Backend ask"). Until those ship, callers degrade gracefully (empty list / 404).
 */
export const listPublicDecks = (
    p: PublicDiscoverParams = {},
): Promise<{ items: DeckWithAuthor[]; nextCursor: string | null; total: number }> =>
    publicGet('/public/discover/decks', {
        query: {
            cursor: p.cursor ?? undefined,
            q: p.q,
            lang: p.lang,
            subject: p.subject,
            sort: p.sort,
        },
    });

export const getPublicCategories = async (): Promise<DiscoverCategories> => {
    const res = await publicGet<Partial<DiscoverCategories>>('/public/discover/categories');
    return { items: res.items ?? [], languages: res.languages ?? [] };
};

// The backend returns `{ deck, cards }` (mirroring GET /decks/:id). Typing that
// response as a flat deck made every field on the public SEO page `undefined` —
// empty <h1>, empty <title>, and an "Open deck" link to /decks/undefined — while
// `cards` resolved by coincidence and masked it.
export const getPublicDeck = async (id: string): Promise<PublicDeckDetail> => {
    const res = await publicGet<{ deck: DeckWithAuthor; cards: Card[] }>(`/public/decks/${id}`);
    return { ...res.deck, cards: res.cards };
};
