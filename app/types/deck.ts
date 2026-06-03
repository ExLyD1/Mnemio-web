export type CardDifficulty = 'easy' | 'medium' | 'hard';
export type CardType = 'basic' | 'cloze' | 'image';

export interface Card {
    id: string;
    deckId: string;
    word: string;
    definition: string;
    phonetic: string | null;
    reading: string | null;
    partOfSpeech: string | null;
    example: string | null;
    exampleTranslation: string | null;
    tags: string[];
    difficulty: CardDifficulty;
    type: CardType;
    audioUrl: string | null;
    imageUrl: string | null;
    position: number;
    createdAt: string;
    updatedAt: string;
}

export interface DeckStats {
    total: number;
    mastered: number;
    learning: number;
    new: number;
    due: number;
    masteredPct: number;
}

export interface Deck {
    id: string;
    ownerId: string;
    title: string;
    description: string | null;
    sourceLanguage: string;
    targetLanguage: string;
    isPublic: boolean;
    coverColor: string | null;
    glyph: string | null;
    subject: string | null;
    featured: boolean;
    copyCount: number;
    sourceDeckId: string | null;
    stats: DeckStats;
    cards: Card[];
    createdAt: string;
    updatedAt: string;
}

export interface DeckInput {
    title: string;
    description: string | null;
    sourceLanguage: string;
    targetLanguage: string;
    isPublic?: boolean;
    coverColor?: string | null;
    glyph?: string | null;
    subject?: string | null;
}

export interface CardInput {
    word: string;
    definition: string;
    phonetic: string | null;
    reading?: string | null;
    partOfSpeech?: string | null;
    example?: string | null;
    exampleTranslation?: string | null;
    tags?: string[];
    difficulty?: CardDifficulty;
    type?: CardType;
    audioUrl?: string | null;
    imageUrl?: string | null;
}

export type DeckSummary = Omit<Deck, 'cards'> & { cardCount: number };

export interface DeckAuthor {
    id: string;
    username: string | null;
    fullName: string | null;
}

export type DeckWithAuthor = DeckSummary & { author: DeckAuthor };

/**
 * Presentation model for the redesigned DeckCard. Built from a deck summary plus
 * its embedded `stats` (mastery, due) and the user's favourites.
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
