import { ref, computed, onBeforeUnmount } from 'vue';
import { useIntervalFn, useEventListener } from '@vueuse/core';
import type { Card, Deck } from '@/types/deck';
import type { SessionCounts, StudyMode, StudySession } from '@/types/session';
import type { SrsRating } from '@/types/srs';
import { useSessionsStore } from '@/stores/sessions';
import { useAnalytics } from '@/composables/useAnalytics';
import type { StudyModeProp } from '@/analytics/events';
import { catalogs } from '@/i18n';
import {
    initQueue,
    applyGrade,
    nextUp,
    pendingCount as queuePendingCount,
    graduatedCount as queueGraduatedCount,
    type QueueState,
} from '@/utils/srsQueue';

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

/**
 * Owns the in-session study queue: a dynamic, due-order ladder (app/utils/srsQueue.ts)
 * rather than a fixed index into a flat array. A card rated "again"/"hard" comes
 * back within the session (1m/10m); the session can only finish once every card
 * has graduated out of the ladder (server interval ≥ 1 day — see srsQueue.ts).
 *
 * The server's own schedule (mnemio-backend src/services/sm2.ts, day-granular,
 * no learning steps) is untouched by this — POST /srs/rate is still the only
 * writer of long-term SRS state. This queue is purely session-local ordering.
 */
export const useStudySession = () => {
    const sessions = useSessionsStore();
    const analytics = useAnalytics();

    const state = ref<StudyState>('idle');
    const session = ref<StudySession | null>(null);
    const queue = ref<Card[]>([]);
    const queueState = ref<QueueState | null>(null);
    const elapsedMs = ref(0);
    // Always a TRANSLATION KEY, never raw text. The backend answers in English,
    // so storing `e.message` here rendered verbatim English to Ukrainian users
    // (the template does t(error, error), so a non-key falls through as-is).
    // Prefer a specific `errors.<CODE>` line when the catalog has one.
    const error = ref<string | null>(null);
    const errorKeyFor = (e: unknown, fallbackKey: string): string => {
        const code = (e as { code?: string } | null)?.code;
        const hasLine =
            typeof code === 'string' &&
            code !== '' &&
            Object.prototype.hasOwnProperty.call(catalogs.en.errors ?? {}, code);
        return hasLine ? `errors.${code}` : fallbackKey;
    };

    const startedAt = ref<number>(0);
    // Ticks while a session is active so `currentCard`/`waitUntil` re-evaluate
    // as time passes, even with no new grade (e.g. waiting for a learning
    // card to become due).
    const nowTick = ref(Date.now());

    // Captured at start() so completion/abandonment events can report mode + deck
    // without re-reading the (possibly mutated) session object.
    const modeProp = ref<StudyModeProp>('flashcard');
    const deckId = ref<string>('');

    // Distinct cards that have received at least one grade this session —
    // drives the server-facing progress index (monotonic) and XP's `correct`
    // tally. Relearning repeats of the same card don't inflate either.
    const gradedCardIds = ref<Set<string>>(new Set());
    const correctCardIds = ref<Set<string>>(new Set());
    // Last card the user was shown, kept for the "previous" look-back. Viewing
    // it does not re-enter the queue or allow re-grading.
    const lastShownCard = ref<Card | null>(null);
    const peeking = ref(false);
    // 'Track progress' (see [mode].vue): true = the session can only finish
    // once every card has graduated out of the relearning ladder (the user
    // gets everything right eventually); false = the session finishes after
    // one pass, once every card has been graded at least once, whatever its
    // ladder state. Read fresh on every grade, so toggling mid-session takes
    // effect immediately — same as the shuffle/front-side toggles.
    const requireGraduation = ref(true);

    const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(
        () => {
            elapsedMs.value = Date.now() - startedAt.value;
            nowTick.value = Date.now();
        },
        500,
        { immediate: false },
    );

    const cardMap = computed(() => new Map(queue.value.map((c) => [c.id, c])));
    const totalCount = computed(() => queue.value.length);
    const graduatedCount = computed(() =>
        queueState.value ? queueGraduatedCount(queueState.value) : 0,
    );
    const pendingCount = computed(() =>
        queueState.value ? queuePendingCount(queueState.value) : 0,
    );
    /** Distinct cards whose most recent grade this session was good/easy —
     * the same tally XP is computed from (computeXp), reused by the results
     * screen so XP and the displayed accuracy never disagree. */
    const correctCount = computed(() => correctCardIds.value.size);

    const queueResult = computed(() => {
        if (!queueState.value) {
            return { kind: 'done' as const };
        }
        return nextUp(queueState.value, nowTick.value);
    });

    const currentCard = computed<Card | null>(() => {
        if (peeking.value) {
            return lastShownCard.value;
        }
        const r = queueResult.value;
        return r.kind === 'card' ? (cardMap.value.get(r.entry.cardId) ?? null) : null;
    });

    /** ms until the next not-yet-due learning card; null when a card is ready now. */
    const waitUntil = computed<number | null>(() =>
        queueResult.value.kind === 'wait' ? queueResult.value.until : null,
    );

    const progress = computed(() =>
        totalCount.value ? Math.round((graduatedCount.value / totalCount.value) * 100) : 0,
    );

    // Analytics helpers (defined after the computeds they read).
    const durationSec = () => Math.round(elapsedMs.value / 1000);
    const accuracy = () =>
        totalCount.value ? Math.round((correctCardIds.value.size / totalCount.value) * 100) : 0;

    const beginQueue = (cardIds: string[]) => {
        queueState.value = initQueue(cardIds, Date.now());
        gradedCardIds.value = new Set();
        correctCardIds.value = new Set();
        lastShownCard.value = null;
        peeking.value = false;
    };

    const start = async (deck: Deck, mode: StudyMode, srsEnabled = true, shuffleCards = true) => {
        if (deck.cards.length === 0) {
            error.value = 'study.errors.emptyDeck';
            state.value = 'idle';
            return null;
        }
        state.value = 'loading';
        error.value = null;
        try {
            const shuffled = shuffleCards ? shuffle(deck.cards) : [...deck.cards];
            const created = await sessions.start({
                deckId: deck.id,
                mode,
                cardIds: shuffled.map((c) => c.id),
                srsEnabled,
            });
            session.value = created;
            queue.value = shuffled;
            beginQueue(shuffled.map((c) => c.id));
            elapsedMs.value = 0;
            startedAt.value = Date.now();
            nowTick.value = startedAt.value;
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
            error.value = errorKeyFor(e, 'study.errors.startFailed');
            state.value = 'idle';
            return null;
        }
    };

    // Resume an existing incomplete session, rebuilding queue from session.cardIds order.
    // NOTE: the sub-day relearning ladder is session-local and not persisted on the
    // wire (no backend field for it yet — see plan's Backend asks). A resumed
    // session starts every card fresh in the ladder rather than restoring exactly
    // where it left off; this is a known, documented limitation.
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
            const cardMapById = new Map(deck.cards.map((c) => [c.id, c]));
            const ordered = s.cardIds
                .map((id) => cardMapById.get(id))
                .filter((c): c is Card => c !== undefined);

            queue.value = ordered.length > 0 ? ordered : shuffle([...deck.cards]);
            beginQueue(queue.value.map((c) => c.id));

            session.value = s;
            elapsedMs.value = 0;
            startedAt.value = Date.now();
            nowTick.value = startedAt.value;
            state.value = 'active';
            modeProp.value = toModeProp(s.mode);
            deckId.value = deck.id;
            resumeTimer();
            return session.value;
        } catch (e) {
            error.value = errorKeyFor(e, 'study.errors.resumeFailed');
            state.value = 'idle';
            return null;
        }
    };

    // Re-randomize the current queue order. Cards already in the learning ladder
    // keep their due times — this only reshuffles the tiebreak order new/unseen
    // entries are picked in, it does not restart progress.
    const reshuffle = async () => {
        if (!session.value || queue.value.length === 0 || !queueState.value) {
            return;
        }
        const shuffled = shuffle([...queue.value]);
        queue.value = shuffled;
        const order = new Map(shuffled.map((c, i) => [c.id, i]));
        queueState.value = {
            ...queueState.value,
            entries: queueState.value.entries.map((e) => ({
                ...e,
                seq: order.get(e.cardId) ?? e.seq,
            })),
        };
    };

    // Reorder the current queue to a specific card order (e.g. the deck's
    // original, unshuffled order) — the "off" side of the shuffle toggle. Same
    // semantics as reshuffle: reorders tiebreak priority, doesn't touch progress.
    const reorder = async (cards: Card[]) => {
        if (!session.value || cards.length === 0 || !queueState.value) {
            return;
        }
        queue.value = [...cards];
        const order = new Map(cards.map((c, i) => [c.id, i]));
        queueState.value = {
            ...queueState.value,
            entries: queueState.value.entries.map((e) => ({
                ...e,
                seq: order.get(e.cardId) ?? e.seq,
            })),
        };
    };

    const finishComplete = async () => {
        if (!session.value) {
            return;
        }
        const xp = computeXp(correctCardIds.value.size, true);
        pauseTimer();
        // Report the measured active study time before completing. The server
        // prefers a client-reported duration and otherwise falls back to
        // wall-clock elapsed — which counts pauses, interruptions and lunch
        // breaks as study time in /stats/study-time. The timer is already
        // paused above, so elapsedMs is final here.
        if (elapsedMs.value > 0) {
            await sessions.updateActive({ durationMs: elapsedMs.value }).catch(() => {});
        }
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

    /**
     * Grade the current card and advance the queue. `tally` controls whether
     * this grade is reflected in the server-facing progress (session.correct,
     * counts, revisitCardIds) — callers pass `false` for in-session relearning
     * repeats of a card already graded once, so retries don't inflate XP or
     * stats sent to the server. The local queue ladder always advances
     * regardless of `tally`.
     */
    const answer = async (
        rating: SrsRating,
        opts: { tally?: boolean; counts?: SessionCounts; revisitCardIds?: string[] } = {},
    ) => {
        if (state.value !== 'active' || !session.value || !queueState.value) {
            return;
        }
        const card = currentCard.value;
        if (!card || peeking.value) {
            return;
        }
        const now = Date.now();
        const correct = rating === 'good' || rating === 'easy';
        lastShownCard.value = card;
        queueState.value = applyGrade(queueState.value, card.id, rating, now);

        const tally = opts.tally ?? true;
        if (tally) {
            gradedCardIds.value = new Set(gradedCardIds.value).add(card.id);
            if (correct) {
                correctCardIds.value = new Set(correctCardIds.value).add(card.id);
            } else {
                correctCardIds.value = new Set(correctCardIds.value);
                correctCardIds.value.delete(card.id);
            }
            await sessions
                .updateActive({
                    index: gradedCardIds.value.size,
                    correct: correctCardIds.value.size,
                    ...(opts.counts ? { counts: opts.counts } : {}),
                    ...(opts.revisitCardIds ? { revisitCardIds: opts.revisitCardIds } : {}),
                })
                .catch(() => {});
            session.value = {
                ...session.value,
                index: gradedCardIds.value.size,
                correct: correctCardIds.value.size,
            };
        }

        const r = nextUp(queueState.value, now);
        const sessionDone = requireGraduation.value
            ? r.kind === 'done'
            : gradedCardIds.value.size >= totalCount.value;
        if (sessionDone) {
            await finishComplete();
        }
    };

    /** Look back at the last-graded card, read-only — no re-grading. */
    const goPrev = () => {
        if (!lastShownCard.value) {
            return;
        }
        peeking.value = true;
    };

    /** Return from the look-back to the live queue. */
    const resumeFromPeek = () => {
        peeking.value = false;
    };

    const canGoPrev = computed(() => lastShownCard.value !== null);

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
            cards_reviewed: gradedCardIds.value.size,
            duration_sec: durationSec(),
        });
    };

    const reset = () => {
        state.value = 'idle';
        session.value = null;
        queue.value = [];
        queueState.value = null;
        elapsedMs.value = 0;
        error.value = null;
        peeking.value = false;
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
                cards_reviewed: gradedCardIds.value.size,
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
        modeProp,
        currentCard,
        waitUntil,
        totalCount,
        graduatedCount,
        pendingCount,
        correctCount,
        progress,
        peeking,
        canGoPrev,
        requireGraduation,
        start,
        resume,
        reshuffle,
        reorder,
        answer,
        goPrev,
        resumeFromPeek,
        finishComplete,
        exit,
        reset,
    };
};
