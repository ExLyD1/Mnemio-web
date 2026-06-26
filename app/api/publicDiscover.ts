import { publicGet } from '@/utils/publicHttp';
import type { Card, DeckWithAuthor } from '@/types/deck';
import type { DiscoverCategory } from '@/types/discover';

export interface PublicDiscoverParams {
    cursor?: string | null;
    q?: string;
    lang?: string;
    subject?: string;
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

export const getPublicCategories = (): Promise<{ items: DiscoverCategory[] }> =>
    publicGet('/public/discover/categories');

export const getPublicDeck = (id: string): Promise<PublicDeckDetail> =>
    publicGet(`/public/decks/${id}`);
