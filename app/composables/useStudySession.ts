import { ref, computed, onBeforeUnmount } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import type { Card, Deck } from '@/types/deck';
import type { StudyMode, StudySession } from '@/types/session';
import { useSessionsStore } from '@/stores/sessions';

export type StudyState = 'idle' | 'loading' | 'active' | 'paused' | 'results';

export const computeXp = (correct: number, completed: boolean): number =>
    correct * 10 + (completed ? 25 : 0);

const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = a[i] as T;
        a[i] = a[j] as T;
        a[j] = tmp;
    }
    return a;
};

export const useStudySession = () => {
    const sessions = useSessionsStore();

    const state = ref<StudyState>('idle');
    const session = ref<StudySession | null>(null);
    const queue = ref<Card[]>([]);
    const elapsedMs = ref(0);
    const error = ref<string | null>(null);

    const startedAt = ref<number>(0);

    const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(
        () => {
            elapsedMs.value = Date.now() - startedAt.value;
        },
        500,
        { immediate: false },
    );

    const currentIndex = computed(() => session.value?.index ?? 0);
    const correctCount = computed(() => session.value?.correct ?? 0);
    const totalCount = computed(() => queue.value.length);
    const currentCard = computed<Card | null>(() => queue.value[currentIndex.value] ?? null);
    const isLastCard = computed(() => currentIndex.value === totalCount.value - 1);
    const progress = computed(() =>
        totalCount.value ? Math.round((currentIndex.value / totalCount.value) * 100) : 0,
    );

    const start = async (deck: Deck, mode: StudyMode) => {
        if (deck.cards.length === 0) {
            error.value = 'study.errors.emptyDeck';
            state.value = 'idle';
            return null;
        }
        state.value = 'loading';
        error.value = null;
        try {
            const shuffled = shuffle(deck.cards);
            const created = await sessions.start({
                deckId: deck.id,
                mode,
                cardIds: shuffled.map((c) => c.id),
            });
            session.value = created;
            queue.value = shuffled;
            elapsedMs.value = 0;
            startedAt.value = Date.now();
            state.value = 'active';
            resumeTimer();
            return created;
        } catch (e) {
            error.value = (e as { message?: string }).message ?? 'Could not start session.';
            state.value = 'idle';
            return null;
        }
    };

    const finishComplete = async () => {
        if (!session.value) {
            return;
        }
        const xp = computeXp(correctCount.value, true);
        pauseTimer();
        const ended = await sessions.complete(xp);
        session.value = ended;
        state.value = 'results';
    };

    const answer = async (correct: boolean) => {
        if (state.value !== 'active' || !session.value) {
            return;
        }
        const nextIndex = currentIndex.value + 1;
        const nextCorrect = correctCount.value + (correct ? 1 : 0);
        await sessions.updateActive({ index: nextIndex, correct: nextCorrect });
        session.value = { ...session.value, index: nextIndex, correct: nextCorrect };
        if (nextIndex >= totalCount.value) {
            await finishComplete();
        }
    };

    const goTo = async (i: number) => {
        if (!session.value) {
            return;
        }
        const clamped = Math.max(0, Math.min(totalCount.value - 1, i));
        if (clamped === currentIndex.value) {
            return;
        }
        session.value = { ...session.value, index: clamped };
        await sessions.updateActive({ index: clamped });
    };
    const goNext = () => goTo(currentIndex.value + 1);
    const goPrev = () => goTo(currentIndex.value - 1);

    const exit = async () => {
        if (state.value !== 'active') {
            return;
        }
        pauseTimer();
        await sessions.exit();
        state.value = 'paused';
    };

    const reset = () => {
        state.value = 'idle';
        session.value = null;
        queue.value = [];
        elapsedMs.value = 0;
        error.value = null;
        pauseTimer();
    };

    onBeforeUnmount(() => {
        pauseTimer();
    });

    return {
        state,
        session,
        queue,
        elapsedMs,
        error,
        currentIndex,
        correctCount,
        totalCount,
        currentCard,
        isLastCard,
        progress,
        start,
        answer,
        goTo,
        goNext,
        goPrev,
        finishComplete,
        exit,
        reset,
    };
};
