import { reactive, ref } from 'vue';
import { useStudySession } from '@/composables/useStudySession';
import { useSrsStore } from '@/stores/srs';
import { useMimi } from '@/composables/useMimi';
import type { Card } from '@/types/deck';
import type { SrsRating } from '@/types/srs';
import type { MimiMood } from '@/types/mimi';

const STREAK_CHEER = 3;

const moodForRating = (rating: SrsRating, correct: boolean, streak: number): MimiMood => {
    if (correct && streak >= STREAK_CHEER) {
        return 'streak';
    }
    if (rating === 'again') {
        return 'forgot';
    }
    return rating;
};

/**
 * Wraps useStudySession with 4-grade SRS rating, Mimi moods, grade counts and a
 * revisit list — everything the Practice + Session Summary screens need.
 */
export const usePractice = () => {
    const study = useStudySession();
    const srs = useSrsStore();
    const mimi = useMimi();

    const revealed = ref(false);
    const streak = ref(0);
    const locked = ref(false);
    const counts = reactive<Record<SrsRating, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
    const revisit = ref<{ word: string; reading: string | null; meaning: string }[]>([]);

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
        }
        mimi.say(moodForRating(rating, correct, streak.value));
        try {
            await srs.rate(card.id, card.deckId, rating);
        } catch {
            // A failed rating shouldn't stop the session; keep moving.
        }
        revealed.value = false;
        await study.answer(correct);
        locked.value = false;
    };

    const grade = (rating: SrsRating, card: Card): Promise<void> => apply(rating, card);
    const recordSimple = (correct: boolean, card: Card): Promise<void> =>
        apply(correct ? 'good' : 'again', card);

    return {
        study,
        revealed,
        streak,
        counts,
        revisit,
        flip,
        goNext,
        goPrev,
        grade,
        recordSimple,
        mimi,
    };
};
