import { ref, computed, onBeforeUnmount } from 'vue';
import { useIntervalFn, useEventListener } from '@vueuse/core';
import type { Card, Deck } from '@/types/deck';
import type { StudyMode, StudySession } from '@/types/session';
import { useSessionsStore } from '@/stores/sessions';
import { useAnalytics } from '@/composables/useAnalytics';
import type { StudyModeProp } from '@/analytics/events';

export type StudyState = 'idle' | 'loading' | 'active' | 'paused' | 'results';

export const computeXp = (correct: number, completed: boolean): number =>
    correct * 10 + (completed ? 25 : 0);

// Wire mode → analytics prop (snake_case, fixed in the event contract).
const toModeProp = (mode: StudyMode): StudyModeProp =>
    mode === 'multiple-choice' ? 'multiple_choice' : mode;

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
    const analytics = useAnalytics();

    const state = ref<StudyState>('idle');
    const session = ref<StudySession | null>(null);
    const queue = ref<Card[]>([]);
    const elapsedMs = ref(0);
    const error = ref<string | null>(null);

    const startedAt = ref<number>(0);

    // Captured at start() so completion/abandonment events can report mode + deck
    // without re-reading the (possibly mutated) session object.
    const modeProp = ref<StudyModeProp>('flashcard');
    const deckId = ref<string>('');

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

    // Analytics helpers (defined after the computeds they read).
    const durationSec = () => Math.round(elapsedMs.value / 1000);
    const accuracy = () =>
        totalCount.value ? Math.round((correctCount.value / totalCount.value) * 100) : 0;

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
            modeProp.value = toModeProp(mode);
            deckId.value = deck.id;
            resumeTimer();
            analytics.track('study_session_started', {
                study_mode: modeProp.value,
                deck_id: deck.id,
                card_count: shuffled.length,
            });
            return created;
        } catch (e) {
            error.value = (e as { message?: string }).message ?? 'Could not start session.';
            state.value = 'idle';
            return null;
        }
    };

    // Resume an existing incomplete session, rebuilding queue from session.cardIds order.
    const resume = async (deck: Deck, sessionId: string) => {
        state.value = 'loading';
        error.value = null;
        try {
            let s: StudySession;
            if (sessions.active?.id === sessionId) {
                s = sessions.active;
            } else {
                s = await sessions.resume(sessionId);
            }

            // Rebuild queue in the same card order the session recorded.
            const cardMap = new Map(deck.cards.map((c) => [c.id, c]));
            const ordered = s.cardIds
                .map((id) => cardMap.get(id))
                .filter((c): c is Card => c !== undefined);

            queue.value = ordered.length > 0 ? ordered : shuffle([...deck.cards]);

            const idx = Math.max(0, Math.min(s.index, queue.value.length - 1));
            session.value = { ...s, index: idx };
            elapsedMs.value = 0;
            startedAt.value = Date.now();
            state.value = 'active';
            modeProp.value = toModeProp(s.mode);
            deckId.value = deck.id;
            resumeTimer();
            return session.value;
        } catch (e) {
            error.value = (e as { message?: string }).message ?? 'Could not resume session.';
            state.value = 'idle';
            return null;
        }
    };

    // Start a new session with a specific subset/order of cards (used by track-progress rounds).
    const startWithCards = async (deck: Deck, mode: StudyMode, cards: Card[]) => {
        if (cards.length === 0) {
            error.value = 'study.errors.emptyDeck';
            state.value = 'idle';
            return null;
        }
        state.value = 'loading';
        error.value = null;
        try {
            const created = await sessions.start({ deckId: deck.id, mode });
            session.value = created;
            queue.value = [...cards];
            elapsedMs.value = 0;
            startedAt.value = Date.now();
            state.value = 'active';
            modeProp.value = toModeProp(mode);
            deckId.value = deck.id;
            resumeTimer();
            return created;
        } catch (e) {
            error.value = (e as { message?: string }).message ?? 'Could not start session.';
            state.value = 'idle';
            return null;
        }
    };

    // Re-randomize the current queue and restart from card 0.
    const reshuffle = async () => {
        if (!session.value || queue.value.length === 0) {
            return;
        }
        queue.value = shuffle([...queue.value]);
        session.value = { ...session.value, index: 0 };
        await sessions.updateActive({ index: 0 });
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
        analytics.track('study_session_completed', {
            study_mode: modeProp.value,
            deck_id: deckId.value,
            cards_reviewed: totalCount.value,
            accuracy: accuracy(),
            duration_sec: durationSec(),
            xp_earned: xp,
        });
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
        analytics.track('study_session_abandoned', {
            study_mode: modeProp.value,
            deck_id: deckId.value,
            cards_reviewed: currentIndex.value,
            duration_sec: durationSec(),
        });
    };

    const reset = () => {
        state.value = 'idle';
        session.value = null;
        queue.value = [];
        elapsedMs.value = 0;
        error.value = null;
        pauseTimer();
    };

    // Tab close / app backgrounded mid-session → record the drop-off and flush
    // the analytics batch before the page goes away (exit() covers in-app leaves).
    if (import.meta.client) {
        const onLeave = () => {
            if (state.value !== 'active') {
                return;
            }
            analytics.track('study_session_abandoned', {
                study_mode: modeProp.value,
                deck_id: deckId.value,
                cards_reviewed: currentIndex.value,
                duration_sec: durationSec(),
            });
            analytics.flush();
        };
        useEventListener(window, 'pagehide', onLeave);
        useEventListener(document, 'visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                onLeave();
            }
        });
    }

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
        resume,
        startWithCards,
        reshuffle,
        answer,
        goTo,
        goNext,
        goPrev,
        finishComplete,
        exit,
        reset,
    };
};
