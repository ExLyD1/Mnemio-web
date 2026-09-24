import { reactive, ref } from 'vue';
import { useStudySession } from '@/composables/useStudySession';
import { useSrsStore } from '@/stores/srs';
import { useMimi } from '@/composables/useMimi';
import { useToast } from '@/composables/useToast';
import { useApiError } from '@/composables/useApiError';
import type { ApiError } from '@/composables/useAsync';
import type { Card } from '@/types/deck';
import type { SrsRating } from '@/types/srs';

/**
 * Wraps useStudySession with 4-grade SRS rating, Mimi moods, grade counts and a
 * revisit list — everything the Practice + Session Summary screens need.
 *
 * @param options.srsEnabled - When false, srs.rate() is skipped (browse mode).
 *   Defaults to true. Pass false when the user chose "Just browse" on the mode picker.
 */
export const usePractice = (options?: { srsEnabled?: boolean }) => {
    const useSrs = options?.srsEnabled !== false;

    const study = useStudySession();
    const srs = useSrsStore();
    const mimi = useMimi();
    const toast = useToast();
    const { apiErrorText } = useApiError();

    const revealed = ref(false);
    const streak = ref(0);
    const locked = ref(false);
    const counts = reactive<Record<SrsRating, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
    const revisit = ref<{ word: string; reading: string | null; meaning: string }[]>([]);
    // Full Card objects for the revisit list — used to seed the next track-progress round.
    const revisitCards = ref<Card[]>([]);

    const flip = (): void => {
        revealed.value = !revealed.value;
    };

    const goNext = (): Promise<void> => {
        revealed.value = false;
        return study.goNext();
    };
    const goPrev = (): Promise<void> => {
        revealed.value = false;
        return study.goPrev();
    };

    const apply = async (rating: SrsRating, card: Card): Promise<void> => {
        if (locked.value) {
            return;
        }
        locked.value = true;
        counts[rating] += 1;
        const correct = rating === 'good' || rating === 'easy';
        if (correct) {
            streak.value += 1;
        } else {
            streak.value = 0;
            revisit.value.push({
                word: card.word,
                reading: card.phonetic,
                meaning: card.definition,
            });
            revisitCards.value.push(card);
        }
        if (useSrs) {
            try {
                await srs.rate(card.id, card.deckId, rating);
            } catch (e) {
                // A failed rating shouldn't stop the session; keep moving.
                // But surface it so the user knows their progress wasn't saved.
                toast.error(apiErrorText(e as ApiError, 'review.errors.rate_failed'));
            }
        }
        // Don't reset `revealed` yet — that would flip the current card back to its
        // front for one frame before the queue advances, producing a visible
        // double-animation (flip-back, then the card-swap transition). Advance the
        // session first so the outgoing card leaves already answered, then reset
        // `revealed` for the incoming card, which mounts fresh (new `:key`) anyway.
        await study.answer(correct);
        revealed.value = false;
        locked.value = false;
    };

    const grade = (rating: SrsRating, card: Card): Promise<void> => apply(rating, card);
    const recordSimple = (correct: boolean, card: Card): Promise<void> =>
        apply(correct ? 'good' : 'again', card);

    // Reset all counts/revisit for the next track-progress round.
    const resetCounts = (): void => {
        counts.again = 0;
        counts.hard = 0;
        counts.good = 0;
        counts.easy = 0;
        streak.value = 0;
        revisit.value = [];
        revisitCards.value = [];
        revealed.value = false;
    };

    return {
        study,
        revealed,
        streak,
        counts,
        revisit,
        revisitCards,
        flip,
        goNext,
        goPrev,
        grade,
        recordSimple,
        resetCounts,
        mimi,
    };
};
