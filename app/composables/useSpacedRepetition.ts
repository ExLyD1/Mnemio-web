import type { CardProgress } from '@/types/srs';

/**
 * SM-2 lives on the SERVER (backend src/services/sm2.ts), which is the only
 * authority on scheduling. A client-side `updateCardProgress` used to live here
 * and diverged from it (it treated `hard` as a pass; the server counts it as a
 * failure). It had no call sites, so nothing was broken by the divergence —
 * but it was the most authoritative-looking SRS documentation in the frontend.
 * Removed rather than corrected: the client must not own this logic.
 *
 * This helper only answers "is this card due now", from the server's own
 * nextReviewAt.
 */
export const isDue = (progress: CardProgress, now: Date = new Date()): boolean =>
    new Date(progress.nextReviewAt).getTime() <= now.getTime();
