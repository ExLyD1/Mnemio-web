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

export interface SrsQueue {
    items: SrsQueueItem[];
    counts: { new: number; learning: number; review: number };
    nextDueAt: string | null;
    newAvailable: number;
    limits: { newPerDay: number; newIntroducedToday: number };
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
