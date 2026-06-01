export interface Card {
    id: string;
    deckId: string;
    word: string;
    definition: string;
    phonetic: string | null;
    position: number;
    createdAt: string;
    updatedAt: string;
}

export interface Deck {
    id: string;
    ownerId: string;
    title: string;
    description: string | null;
    sourceLanguage: string;
    targetLanguage: string;
    isPublic: boolean;
    cards: Card[];
    createdAt: string;
    updatedAt: string;
}

export interface DeckInput {
    title: string;
    description: string | null;
    sourceLanguage: string;
    targetLanguage: string;
}

export interface CardInput {
    word: string;
    definition: string;
    phonetic: string | null;
}

export type DeckSummary = Omit<Deck, 'cards'> & { cardCount: number };

/**
 * Presentation model for the redesigned DeckCard. Built from a DeckSummary plus
 * derived/mocked stats (mastery, due, favourite) — see plan §3.5 / §5.3.
 */
export interface DeckCardVM {
    id: string;
    title: string;
    tag?: string;
    glyph?: string;
    total: number;
    masteredPct: number;
    due: number;
    swatch: string;
    favorite?: boolean;
    author?: string;
    copies?: number;
}
