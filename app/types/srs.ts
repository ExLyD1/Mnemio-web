import type { Card } from '@/types/deck';

export type SrsRating = 'again' | 'hard' | 'good' | 'easy';
export type PracticeMode = 'srs' | 'know';
export type SrsState = 'new' | 'learning' | 'review' | 'relearning';
export type IntervalPreview = { kind: 'secs' | 'days'; value: number };
export type Previews = Record<SrsRating, IntervalPreview>;

export interface SrsQueueItem {
    card: Card;
    state: SrsState;
    dueAt: string | null;
    previews: Previews;
}

/** One deck's due count in a queue's scope (powers the /review hub). */
export interface SrsDeckDue {
    deckId: string;
    deckTitle: string;
    coverColor: string | null;
    glyph: string | null;
    due: number;
}

export interface SrsQueue {
    items: SrsQueueItem[];
    counts: { new: number; learning: number; review: number };
    nextDueAt: string | null;
    newAvailable: number;
    limits: { newPerDay: number; newIntroducedToday: number };
    // Uncapped per-deck due counts, most due first.
    byDeck: SrsDeckDue[];
}

/** Which cards a queue covers: one deck (with its new cards), a set of decks, or all. */
export interface QueueScope {
    deckId?: string;
    deckIds?: string[];
    extraNew?: number;
}

export interface CardProgress {
    cardId: string;
    deckId: string;
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    nextReviewAt: string;
    lastReviewedAt: string | null;
    state: SrsState;
    lapses: number;
    leeched: boolean;
    remainingSteps: number;
    reps: number;
}
