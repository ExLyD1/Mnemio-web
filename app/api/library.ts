import { http } from '@/utils/http';
import { normLang } from '@/api/decks';
import type { DeckWithAuthor } from '@/types/deck';
import type { Subject } from '@/utils/subjects';

export type LibraryScope = 'all' | 'my' | 'learning';

export const LIBRARY_SCOPES: readonly LibraryScope[] = ['all', 'my', 'learning'];

export interface LibraryParams {
    scope?: LibraryScope;
    subject?: Subject;
    /** ISO 639-1; matches the deck's targetLanguage. */
    lang?: string;
    cursor?: string | null;
    limit?: number;
}

/** A deck the user owns or is learning; `stats` are the user's own progress. */
export type LibraryDeck = DeckWithAuthor & {
    isOwner: boolean;
    /** Distinct cards the user has studied (0 if never). */
    studiedCount: number;
    /** null = never studied (own decks only). */
    lastStudiedAt: string | null;
};

export interface LibraryFacets {
    /** Ignore scope / subject / lang. */
    scopes: Record<LibraryScope, number>;
    /** Within the scope; zero counts omitted. */
    subjects: { subject: Subject; count: number }[];
    /** Within the scope, language decks only. */
    languages: { lang: string; count: number }[];
}

export interface LibraryPage {
    items: LibraryDeck[];
    nextCursor: string | null;
    total: number;
    /** First page only. */
    facets?: LibraryFacets;
}

/** GET /library — sorted most recently studied first (server-side filters). */
export const listLibrary = async (p: LibraryParams = {}): Promise<LibraryPage> => {
    const res = await http<LibraryPage>('/library', {
        query: {
            scope: p.scope,
            subject: p.subject,
            lang: p.lang,
            cursor: p.cursor ?? undefined,
            limit: p.limit,
        },
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
