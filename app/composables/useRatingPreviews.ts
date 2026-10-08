import { computed, type Ref } from 'vue';
import { useDuration } from '@/composables/useDuration';
import { previewIntervalDays } from '@/utils/srsPreview';
import { LEARNING_STEPS_MS } from '@/utils/srsQueue';
import type { CardProgress, SrsRating } from '@/types/srs';

/**
 * Builds the "next review in..." label shown on each of the four rating
 * buttons (RatingRow). Again/Hard show the IN-SESSION relearning ladder time
 * (srsQueue.ts) — that's literally when the card comes back this session.
 * Good/Easy show the SERVER's day-granular forecast (srsPreview.ts, a mirror
 * of sm2.ts) since the backend has no sub-day concept at all. These are two
 * different clocks and that's deliberate, not a bug — see Phase 3 of the plan.
 */
export const useRatingPreviews = (progress: Ref<CardProgress | null | undefined>) => {
    const { formatDuration, formatDays } = useDuration();

    const previews = computed<Partial<Record<SrsRating, string>>>(() => {
        const p = progress.value ?? null;
        return {
            again: formatDuration(LEARNING_STEPS_MS[0]),
            hard: formatDuration(LEARNING_STEPS_MS[1]),
            good: formatDays(previewIntervalDays(p, 'good')),
            easy: formatDays(previewIntervalDays(p, 'easy')),
        };
    });

    return { previews };
};
