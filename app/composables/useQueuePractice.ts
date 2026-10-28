import { computed, reactive, ref } from 'vue';
import { useIntervalFn } from '@vueuse/core';
import { useSrsQueue } from '@/composables/useSrsQueue';
import { useAsync, type ApiError } from '@/composables/useAsync';
import { useDecks } from '@/composables/useDecks';
import { useSessionsStore } from '@/stores/sessions';
import { usePracticeStore } from '@/stores/practice';
import { useApiError } from '@/composables/useApiError';
import { useToast } from '@/composables/useToast';
import { useT } from '@/composables/useT';
import { useAnalytics } from '@/composables/useAnalytics';
import {
    flushPlan,
    newRunId,
    retryDelayMs,
    tallyAnswer,
    tallySnapshot,
    tallyStart,
    type DeckTally,
    type ReviewOrder,
    type RunTallies,
} from '@/utils/reviewScope';
import type { PracticeFormat } from '@/composables/usePracticePreferences';
import type { Card } from '@/types/deck';
import type { PracticeMode, SrsRating } from '@/types/srs';
import type { SessionCounts } from '@/types/session';

const emptyCounts = (): SessionCounts => ({ again: 0, hard: 0, good: 0, easy: 0 });
// Leaving a review waits this long for its session stats to save, then goes
// anyway (the writes carry on in the background).
const EXIT_FLUSH_WAIT_MS = 3000;
// A deck that vanished or went private mid-run is skipped, not retried forever.
const SKIP_DECK_CODES = new Set(['DECK_NOT_FOUND', 'DECK_EMPTY', 'SESSION_NO_CARDS']);
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const shuffled = (cards: Card[]) => {
    const result = [...cards];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const first = result[i];
        const second = result[j];
        if (first && second) {
            [result[i], result[j]] = [second, first];
        }
    }
    return result;
};

/**
 * Shared practice lifecycle for deck study and the review queue.
 *
 * Deck study (`deckId`) keeps a live session: started up front, PATCHed per
 * answer, resumable. Review (no `deckId`) opens no session while reviewing: it
 * tallies per deck and, when the run ends or the user leaves, writes one
 * completed session per deck touched under a shared runId (see reviewScope.ts).
 */
export const useQueuePractice = (options: {
    deckId?: string;
    /** Review scope: these decks only (absent = every deck). */
    deckIds?: string[];
    order?: ReviewOrder;
    mode: PracticeMode;
    format: PracticeFormat;
    resume?: boolean;
}) => {
    const srs = useSrsQueue();
    const decks = useDecks();
    const sessions = useSessionsStore();
    const startRecord = useAsync(sessions.start);
    const updateRecord = useAsync(sessions.updateActive);
    const completeRecord = useAsync(sessions.complete);
    const exitRecord = useAsync(sessions.exit);
    const resumeRecord = useAsync(sessions.resume);
    const resultStore = usePracticeStore();
    const toast = useToast();
    const { t } = useT();
    const { apiErrorText } = useApiError();
    const analytics = useAnalytics();
    const isSrs = options.mode === 'srs';
    const isReview = !options.deckId;
    const loading = ref(true);
    const locked = ref(false);
    const error = ref('');
    const revealed = ref(false);
    const finished = ref(false);
    const roundDone = ref(false);
    const shuffleEnabled = ref(true);
    const trackProgress = ref(true);
    const counts = reactive(emptyCounts());
    const recordCounts = ref(emptyCounts());
    const answers = ref(0);
    const streak = ref(0);
    const elapsedMs = ref(0);
    const initialCards = ref<Card[]>([]);
    const knowQueue = ref<Card[]>([]);
    const knowIndex = ref(0);
    const unknown = ref<Card[]>([]);
    let startedAt = 0;
    let recordStartedAt = 0;
    let recordDeckId: string | null = null;
    // Review run state: per-deck tallies, flushed once at the end.
    let runId = newRunId();
    const tallies = ref<RunTallies>({});
    const written = new Set<string>();
    // Started-but-not-completed session per deck, so a retry completes it
    // instead of opening a second one (which would leave the first incomplete).
    const pendingSession = new Map<string, string>();
    let lastDeckId: string | null = null;
    let lastAnswerAt = 0;
    let flushing: Promise<boolean> | null = null;
    const saveFailed = ref(false);
    const { pause, resume } = useIntervalFn(
        () => {
            elapsedMs.value = Date.now() - startedAt;
        },
        500,
        { immediate: false },
    );

    const current = computed(() =>
        isSrs ? (srs.current.value?.card ?? null) : (knowQueue.value[knowIndex.value] ?? null),
    );
    const remaining = computed(() =>
        isSrs
            ? srs.counts.value.new + srs.counts.value.learning + srs.counts.value.review
            : Math.max(0, knowQueue.value.length - knowIndex.value),
    );
    const deck = computed(() =>
        options.deckId && decks.store.deck?.id === options.deckId ? decks.store.deck : null,
    );

    const report = (err: { code?: string; message?: string } | null) =>
        toast.error(apiErrorText(err));
    const syncRecord = async () => {
        if (!recordDeckId) {
            return true;
        }
        const c = recordCounts.value;
        const saved = await updateRecord.execute({
            index: c.again + c.hard + c.good + c.easy,
            correct: c.hard + c.good + c.easy,
            counts: { ...c },
            revisitCardIds: unknown.value
                .filter((card) => card.deckId === recordDeckId)
                .map((card) => card.id),
            durationMs: Date.now() - recordStartedAt,
        });
        if (!saved) {
            report(updateRecord.error.value);
        }
        return !!saved;
    };
    const closeRecord = async () => {
        if (!recordDeckId) {
            return true;
        }
        if (!(await syncRecord())) {
            return false;
        }
        const ended = await completeRecord.execute();
        if (!ended) {
            report(completeRecord.error.value);
            return false;
        }
        recordDeckId = null;
        return true;
    };
    const ensureRecord = async (card: Card) => {
        if (recordDeckId === card.deckId) {
            return true;
        }
        // Sessions are deck-scoped and the server permits only one active record.
        // Global review therefore completes a deck segment before opening the next.
        if (!(await closeRecord())) {
            return false;
        }
        const created = await startRecord.execute({
            deckId: card.deckId,
            mode: options.format,
            srsEnabled: isSrs,
            cardIds: (isSrs ? initialCards.value : knowQueue.value)
                .filter((c) => c.deckId === card.deckId)
                .map((c) => c.id),
        });
        if (!created) {
            report(startRecord.error.value);
            return false;
        }
        recordDeckId = card.deckId;
        recordCounts.value = emptyCounts();
        recordStartedAt = Date.now();
        return true;
    };
    const saveResult = () => {
        resultStore.setResult({
            deckId: options.deckId ?? '',
            deckTitle: deck.value?.title ?? '',
            reviewed: answers.value,
            correct: counts.hard + counts.good + counts.easy,
            streak: streak.value,
            timeMs: elapsedMs.value,
            counts: { ...counts },
            revisit: unknown.value.map((card) => ({
                word: card.word,
                reading: card.reading ?? card.phonetic,
                meaning: card.definition,
            })),
        });
    };
    const withRateRetry = async <T>(request: () => Promise<T>): Promise<T> => {
        try {
            return await request();
        } catch (err) {
            if ((err as ApiError | null)?.code !== 'RATE_LIMITED') {
                throw err;
            }
            await sleep(retryDelayMs((err as ApiError).details));
            return request();
        }
    };
    const writeTally = async (tally: DeckTally) => {
        try {
            const pending = pendingSession.get(tally.deckId);
            if (!pending || sessions.active?.id !== pending) {
                const created = await withRateRetry(() =>
                    sessions.start({
                        ...tallyStart(tally),
                        mode: options.format,
                        srsEnabled: isSrs,
                        runId,
                    }),
                );
                pendingSession.set(tally.deckId, created.id);
            }
            // Re-read the tally: an answer may have landed while the start was in flight.
            const latest = tallies.value[tally.deckId] ?? tally;
            const ended = await withRateRetry(() => sessions.complete(tallySnapshot(latest)));
            if (!ended) {
                return false;
            }
        } catch (err) {
            const code = (err as ApiError | null)?.code ?? '';
            // SESSION_NOT_ACTIVE on complete: it already completed (a lost response)
            // or was superseded; either way writing it again would double-count.
            if (!SKIP_DECK_CODES.has(code) && code !== 'SESSION_NOT_ACTIVE') {
                return false;
            }
        }
        written.add(tally.deckId);
        pendingSession.delete(tally.deckId);
        return true;
    };
    /**
     * Write one completed session per touched deck, sequentially. Safe to call
     * repeatedly: concurrent calls share one run, written decks are skipped.
     */
    const flush = (): Promise<boolean> => {
        flushing ??= (async () => {
            try {
                for (const tally of flushPlan(tallies.value, lastDeckId, written)) {
                    if (!(await writeTally(tally))) {
                        saveFailed.value = true;
                        toast.error(t('review.saveFailed'));
                        return false;
                    }
                }
                saveFailed.value = false;
                return true;
            } finally {
                flushing = null;
            }
        })();
        return flushing;
    };
    const finishSession = async () => {
        if (!isReview && !(await closeRecord())) {
            return false;
        }
        elapsedMs.value = Date.now() - startedAt;
        pause();
        saveResult();
        if (!isSrs && trackProgress.value && unknown.value.length) {
            // Know-mode rounds stay one run: the next round keeps tallying.
            roundDone.value = true;
        } else {
            finished.value = true;
            if (isReview) {
                // Results show right away; the session writes land behind them.
                void flush();
            }
            if (!options.deckId && isSrs) {
                analytics.track('review_due_cleared', { cards_reviewed: answers.value });
            }
        }
        return true;
    };
    const submit = async (rating: SrsRating) => {
        const card = current.value;
        if (!card || locked.value || finished.value || roundDone.value) {
            return;
        }
        locked.value = true;
        // Hide the answer right away so the card flips back while the rating saves.
        revealed.value = false;
        try {
            if (!isReview && !(await ensureRecord(card))) {
                return;
            }
            if (isSrs && !(await srs.submit(rating))) {
                report(srs.rate.error.value);
                return;
            }
            const correct = rating !== 'again';
            counts[rating] += 1;
            if (isReview) {
                const now = Date.now();
                tallies.value = tallyAnswer(tallies.value, card, rating, now - lastAnswerAt);
                lastAnswerAt = now;
                lastDeckId = card.deckId;
            } else {
                recordCounts.value[rating] += 1;
            }
            answers.value += 1;
            streak.value = correct ? streak.value + 1 : 0;
            unknown.value = unknown.value.filter((c) => c.id !== card.id);
            if (!correct) {
                unknown.value.push(card);
            }
            if (!isSrs) {
                knowIndex.value += 1;
            }
            // A successful rating must never be resubmitted if recording stats fails.
            if (!isReview) {
                await syncRecord();
            }
            // Re-read after advance(): Vue computed refs change across the awaited rating.
            if (isSrs ? !srs.current.value : knowIndex.value >= knowQueue.value.length) {
                await finishSession();
            }
        } finally {
            locked.value = false;
        }
    };
    const finish = async () => {
        if (locked.value) {
            return false;
        }
        locked.value = true;
        try {
            return await finishSession();
        } finally {
            locked.value = false;
        }
    };
    const nextRound = () => {
        if (locked.value) {
            return;
        }
        knowQueue.value = shuffleEnabled.value ? shuffled(unknown.value) : [...unknown.value];
        unknown.value = [];
        knowIndex.value = 0;
        roundDone.value = false;
        // Time on the round-complete screen isn't study time.
        lastAnswerAt = Date.now();
        resume();
    };
    const toggleShuffle = () => {
        if (locked.value || isSrs) {
            return;
        }
        shuffleEnabled.value = !shuffleEnabled.value;
        const pending = knowQueue.value.slice(knowIndex.value);
        const ids = new Set(pending.map((card) => card.id));
        knowQueue.value = [
            ...knowQueue.value.slice(0, knowIndex.value),
            ...(shuffleEnabled.value
                ? shuffled(pending)
                : initialCards.value.filter((card) => ids.has(card.id))),
        ];
        revealed.value = false;
        localStorage.setItem('mnemio_shuffle_enabled', String(shuffleEnabled.value));
    };
    const initialize = async (extraNew = 0) => {
        loading.value = true;
        error.value = '';
        finished.value = false;
        roundDone.value = false;
        Object.assign(counts, emptyCounts());
        answers.value = 0;
        unknown.value = [];
        streak.value = 0;
        elapsedMs.value = 0;
        revealed.value = false;
        if (isReview) {
            // A fresh load is a fresh run; anything unsaved from the last one is
            // written first so it keeps its own runId.
            await flush();
            runId = newRunId();
            tallies.value = {};
            written.clear();
            pendingSession.clear();
            lastDeckId = null;
            saveFailed.value = false;
        }
        try {
            if (options.deckId) {
                const loaded = await decks.fetchOne.execute(options.deckId);
                if (!loaded) {
                    error.value = apiErrorText(decks.fetchOne.error.value);
                    return;
                }
            }
            if (isSrs || !options.deckId) {
                const loaded = await srs.load({
                    deckId: options.deckId,
                    deckIds: options.deckIds,
                    order: options.order,
                    extraNew,
                });
                if (!loaded) {
                    error.value = apiErrorText(srs.fetchQueue.error.value);
                    return;
                }
                initialCards.value = srs.initial.value
                    .filter((item) => isSrs || !item.dueAt || Date.parse(item.dueAt) <= Date.now())
                    .map((item) => item.card);
            } else {
                initialCards.value = [...(deck.value?.cards ?? [])];
            }
            if (!isSrs) {
                shuffleEnabled.value = localStorage.getItem('mnemio_shuffle_enabled') !== 'false';
                trackProgress.value = localStorage.getItem('mnemio_track_progress') !== 'false';
                knowQueue.value = shuffleEnabled.value
                    ? shuffled(initialCards.value)
                    : [...initialCards.value];
                knowIndex.value = 0;
                if (options.resume && options.deckId) {
                    await sessions.hydrate().catch(() => {});
                    const previous = sessions.active ?? sessions.latestIncomplete;
                    if (previous?.deckId === options.deckId && !previous.srsEnabled) {
                        const restored =
                            previous.status === 'active'
                                ? previous
                                : await resumeRecord.execute(previous.id);
                        if (!restored) {
                            error.value = apiErrorText(resumeRecord.error.value);
                            return;
                        }
                        const byId = new Map(initialCards.value.map((card) => [card.id, card]));
                        knowQueue.value = restored.cardIds
                            .map((id) => byId.get(id))
                            .filter((card): card is Card => !!card);
                        knowIndex.value = Math.min(restored.index, knowQueue.value.length);
                        Object.assign(counts, restored.counts);
                        recordCounts.value = { ...restored.counts };
                        answers.value = restored.index;
                        unknown.value = restored.revisitCardIds
                            .map((id) => byId.get(id))
                            .filter((card): card is Card => !!card);
                        recordDeckId = restored.deckId;
                        recordStartedAt = Date.now() - restored.durationMs;
                    }
                }
            }
            startedAt = Date.now();
            lastAnswerAt = startedAt;
            resume();
            if (current.value && isReview) {
                analytics.track('study_session_started', {
                    study_mode:
                        options.format === 'multiple-choice' ? 'multiple_choice' : 'flashcard',
                    deck_id: current.value.deckId,
                    card_count: initialCards.value.length,
                });
            } else if (current.value) {
                if (!(await ensureRecord(current.value))) {
                    error.value = apiErrorText(startRecord.error.value);
                } else {
                    analytics.track('study_session_started', {
                        study_mode:
                            options.format === 'multiple-choice' ? 'multiple_choice' : 'flashcard',
                        deck_id: current.value.deckId,
                        card_count: initialCards.value.length,
                    });
                }
            } else {
                await finishSession();
            }
        } finally {
            loading.value = false;
        }
    };
    const exit = async () => {
        if (isReview) {
            pause();
            // Bounded: a slow or failed save never traps the user here.
            await Promise.race([flush(), sleep(EXIT_FLUSH_WAIT_MS)]);
            return true;
        }
        if (locked.value || loading.value) {
            return false;
        }
        if (recordDeckId) {
            if (!(await syncRecord())) {
                return false;
            }
            await exitRecord.execute();
            if (exitRecord.error.value) {
                report(exitRecord.error.value);
                return false;
            }
            recordDeckId = null;
        }
        pause();
        return true;
    };

    return {
        srs,
        deck,
        current,
        remaining,
        initialCards,
        loading,
        locked,
        error,
        revealed,
        finished,
        roundDone,
        shuffleEnabled,
        trackProgress,
        counts,
        answers,
        unknown,
        elapsedMs,
        initialize,
        submit,
        finish,
        exit,
        nextRound,
        toggleShuffle,
        saveResult,
        tallies,
        saveFailed,
        flush,
    };
};
