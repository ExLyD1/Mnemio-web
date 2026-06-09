import type { CardProgress, SrsQuality } from '@/types/srs';

const MIN_EASE_FACTOR = 1.3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * SM-2 algorithm. Pure: no side effects, no store access.
 * Given a quality 0..5, returns the next CardProgress.
 *
 * Quality scale: 0 = total blackout, 5 = perfect recall.
 * Quality <3 resets the interval to 1 day and zeroes the repetition count.
 * easeFactor is bounded at MIN_EASE_FACTOR (1.3).
 */
export const updateCardProgress = (
    progress: CardProgress,
    quality: SrsQuality,
    now: Date = new Date(),
): CardProgress => {
    let { easeFactor, intervalDays, repetitions } = progress;

    if (quality < 3) {
        repetitions = 0;
        intervalDays = 1;
    } else {
        repetitions = repetitions + 1;
        if (repetitions === 1) {
            intervalDays = 1;
        } else if (repetitions === 2) {
            intervalDays = 6;
        } else {
            intervalDays = Math.round(intervalDays * easeFactor);
        }
    }

    const nextEase = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(MIN_EASE_FACTOR, nextEase);

    const nextReviewAt = new Date(now.getTime() + intervalDays * MS_PER_DAY).toISOString();

    return {
        ...progress,
        easeFactor,
        intervalDays,
        repetitions,
        nextReviewAt,
        lastReviewedAt: now.toISOString(),
    };
};

export const isDue = (progress: CardProgress, now: Date = new Date()): boolean =>
    new Date(progress.nextReviewAt).getTime() <= now.getTime();
