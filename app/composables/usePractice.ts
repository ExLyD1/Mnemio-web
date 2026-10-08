import { reactive, ref } from 'vue';
import { useStudySession } from '@/composables/useStudySession';
import { useSrsStore } from '@/stores/srs';
import { useMimi } from '@/composables/useMimi';
import { useToast } from '@/composables/useToast';
import { useApiError } from '@/composables/useApiError';
import { useAnalytics } from '@/composables/useAnalytics';
import type { ApiError } from '@/composables/useAsync';
import type { Card } from '@/types/deck';
import type { SrsRating } from '@/types/srs';
import { previewIntervalDays } from '@/utils/srsPreview';

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
    const analytics = useAnalytics();

    const revealed = ref(false);
    const streak = ref(0);
    const locked = ref(false);
    const counts = reactive<Record<SrsRating, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
    const revisit = ref<{ word: string; reading: string | null; meaning: string }[]>([]);
    // Full Card objects for the revisit list — used to seed a "study unknown" pass.
    const revisitCards = ref<Card[]>([]);
    // Cards already pushed into revisit this session — prevents the duplicate
    // push a card used to get on every lapse (one deck could replay the same
    // card twice because of it).
    const revisitedIds = ref<Set<string>>(new Set());

    // Cards already rated at least once THIS session. The server treats every
    // "again"/"hard" as a full lapse (-0.2 ease, reset to 1 day) — re-sending
    // that for the same card's in-session relearning repeats would collapse
    // its long-term ease toward the floor in one sitting. The dynamic queue
    // (srsQueue.ts) still re-shows the card for drilling; only the FIRST grade
    // this session reaches the server and the session-progress tally.
    const ratedThisSession = ref<Set<string>>(new Set());

    const flip = (): void => {
        revealed.value = !revealed.value;
    };

    const goPrev = (): void => {
        study.goPrev();
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
            if (!revisitedIds.value.has(card.id)) {
                revisitedIds.value.add(card.id);
                revisit.value.push({
                    word: card.word,
                    reading: card.phonetic,
                    meaning: card.definition,
                });
                revisitCards.value.push(card);
            }
        }

        const firstGrade = !ratedThisSession.value.has(card.id);
        ratedThisSession.value.add(card.id);

        if (useSrs && firstGrade) {
            // Captured before the call: previewIntervalDays mirrors the server's
            // sm2.ts against the PRIOR progress, so it can be compared with what
            // the server actually returns. Dev-only drift alarm — see srsPreview.ts.
            const priorProgress = srs.progress[card.id] ?? null;
            try {
                const updated = await srs.rate(card.id, card.deckId, rating);
                if (import.meta.dev) {
                    const expected = previewIntervalDays(priorProgress, rating);
                    if (updated.intervalDays !== expected) {
                        console.warn(
                            `[srsPreview] mirror drift on "${rating}": expected ${expected}d, server returned ${updated.intervalDays}d`,
                            { cardId: card.id },
                        );
                    }
                }
            } catch (e) {
                // A failed rating shouldn't stop the session; keep moving.
                // But surface it so the user knows their progress wasn't saved.
                toast.error(apiErrorText(e as ApiError, 'review.errors.rate_failed'));
            }
        }

        analytics.track('study_card_answered', {
            study_mode: study.modeProp.value,
            deck_id: card.deckId,
            correct,
            grade: rating,
        });

        // Don't reset `revealed` yet — that would flip the current card back to its
        // front for one frame before the queue advances, producing a visible
        // double-animation (flip-back, then the card-swap transition). Advance the
        // session first so the outgoing card leaves already answered, then reset
        // `revealed` for the incoming card, which mounts fresh (new `:key`) anyway.
        await study.answer(rating, {
            tally: firstGrade,
            counts: { ...counts },
            revisitCardIds: revisitCards.value.map((c) => c.id),
        });
        revealed.value = false;
        locked.value = false;
    };

    const grade = (rating: SrsRating, card: Card): Promise<void> => apply(rating, card);
    const recordSimple = (correct: boolean, card: Card): Promise<void> =>
        apply(correct ? 'good' : 'again', card);

    // Reset all counts/revisit — used when starting a brand-new session.
    const resetCounts = (): void => {
        counts.again = 0;
        counts.hard = 0;
        counts.good = 0;
        counts.easy = 0;
        streak.value = 0;
        revisit.value = [];
        revisitCards.value = [];
        revisitedIds.value = new Set();
        ratedThisSession.value = new Set();
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
        goPrev,
        grade,
        recordSimple,
        resetCounts,
        mimi,
    };
};
