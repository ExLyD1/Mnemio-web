export type SrsQuality = 0 | 1 | 2 | 3 | 4 | 5;

export type SrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface CardProgress {
    cardId: string;
    deckId: string;
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    nextReviewAt: string;
    lastReviewedAt: string | null;
}

export const RATING_TO_QUALITY: Record<SrsRating, SrsQuality> = {
    again: 0,
    hard: 3,
    good: 4,
    easy: 5,
};
