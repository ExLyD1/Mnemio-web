import type { SrsRating } from '@/types/srs';

/**
 * DISPLAY-ONLY mirror of the backend's SM-2 (mnemio-backend/src/services/sm2.ts).
 * The server is the only scheduling authority — this never writes state and
 * has no call sites outside rendering a label on a rating button. It exists
 * because the server has no "preview what each grade would do" endpoint (see
 * the plan's Backend asks #1); once that endpoint exists, this file goes away.
 *
 * This is NOT the client-side `updateCardProgress` that was deliberately
 * removed from useSpacedRepetition.ts for owning authoritative SRS state —
 * that mutated progress the app relied on. This only labels a button.
 *
 * KEEP IN SYNC with sm2.ts. A dev-only console.warn in usePractice.ts
 * compares this against the server's own returned interval after every
 * rating, so drift doesn't go unnoticed.
 */

const MIN_EF = 1.3;

const RATING_TO_QUALITY: Record<SrsRating, 0 | 2 | 3 | 5> = {
    again: 0,
    hard: 2,
    good: 3,
    easy: 5,
};

export interface PreviewInput {
    repetitions: number;
    intervalDays: number;
    easeFactor: number;
}

/** Mirrors sm2.review()'s interval branch exactly. Returns whole days. */
export const previewIntervalDays = (p: PreviewInput | null, rating: SrsRating): number => {
    const state = p ?? { repetitions: 0, intervalDays: 0, easeFactor: 2.5 };
    const quality = RATING_TO_QUALITY[rating];

    if (quality < 3) {
        // Failed recall: reset progress; review again tomorrow.
        return 1;
    }

    // Successful recall: advance schedule.
    const nextRepetitions = state.repetitions + 1;
    if (nextRepetitions === 1) {
        return 1;
    }
    if (nextRepetitions === 2) {
        return 6;
    }
    return Math.round(state.intervalDays * state.easeFactor);
};

/** Mirrors sm2.review()'s ease-factor branch exactly. */
export const previewEaseFactor = (p: PreviewInput | null, rating: SrsRating): number => {
    const state = p ?? { repetitions: 0, intervalDays: 0, easeFactor: 2.5 };
    const quality = RATING_TO_QUALITY[rating];

    if (quality < 3) {
        return Math.max(MIN_EF, state.easeFactor - 0.2);
    }
    return Math.max(
        MIN_EF,
        state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    );
};
