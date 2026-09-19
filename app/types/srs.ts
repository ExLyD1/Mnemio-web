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

// NOTE: rating -> SM-2 quality mapping is deliberately NOT defined here. The
// server owns it (backend src/services/sm2.ts): again 0, hard 2, good 3,
// easy 5 — `hard` counts as a FAILURE. A client-side copy used to live here
// with hard:3/good:4, contradicting the server. It had no call sites; it was
// removed rather than corrected so there is one source of truth.
