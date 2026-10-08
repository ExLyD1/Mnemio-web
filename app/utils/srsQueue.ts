import type { SrsRating } from '@/types/srs';

export type QueueKind = 'new' | 'learning' | 'review';

export interface QueueEntry {
    cardId: string;
    kind: QueueKind;
    /** Epoch ms when this entry becomes serveable. */
    dueAt: number;
    /** Index into LEARNING_STEPS_MS this entry is sitting at. A fresh card starts at 0 (the first rung); `good` advances it, `again` resets it to 0, `easy` graduates immediately. */
    step: number;
    /** Lapses within THIS session only (drives "still learning" counts). */
    lapses: number;
    graduated: boolean;
    /** Stable tiebreaker for entries with equal dueAt. */
    seq: number;
}

export interface QueueState {
    entries: QueueEntry[];
    nextSeq: number;
}

/**
 * Session-local relearning ladder (mirrors Anki's defaults). The backend
 * scheduler (mnemio-backend/src/services/sm2.ts) only knows whole days -- a
 * lapsed card is always "tomorrow" there. This ladder is what makes a
 * "Forgot" card actually come back a minute later WITHIN this session,
 * without touching the server's day-granular schedule. See srsPreview.ts for
 * the day-interval mirror used on Good/Easy.
 */
export const LEARNING_STEPS_MS: readonly [number, number] = [60_000, 600_000]; // one minute, then ten minutes

/** Serve a not-yet-due learning card early rather than idling the session. */
export const LEARN_AHEAD_MS = 20 * 60_000;

export const initQueue = (cardIds: string[], now: number): QueueState => {
    const entries: QueueEntry[] = cardIds.map((cardId, i) => ({
        cardId,
        kind: 'new',
        dueAt: now,
        step: 0,
        lapses: 0,
        graduated: false,
        seq: i,
    }));
    return { entries, nextSeq: cardIds.length };
};

export const applyGrade = (
    s: QueueState,
    cardId: string,
    rating: SrsRating,
    now: number,
): QueueState => {
    const entries = s.entries.map((e): QueueEntry => {
        if (e.cardId !== cardId) {
            return e;
        }
        const seq = s.nextSeq;
        if (rating === 'again') {
            return {
                ...e,
                kind: 'learning',
                step: 0,
                dueAt: now + LEARNING_STEPS_MS[0],
                lapses: e.lapses + 1,
                graduated: false,
                seq,
            };
        }
        if (rating === 'hard') {
            // No advance -- repeat the current (or first) step, same spot in
            // the ladder, just further out than `again`.
            const step = Math.max(e.step, 0);
            return {
                ...e,
                kind: 'learning',
                step,
                dueAt: now + LEARNING_STEPS_MS[1],
                graduated: false,
                seq,
            };
        }
        if (rating === 'easy') {
            // Perfect recall graduates immediately, whatever step it was at.
            return { ...e, kind: 'review', graduated: true, seq };
        }
        // good: advance one step; graduate once past the last step.
        const nextStep = e.step + 1;
        if (nextStep >= LEARNING_STEPS_MS.length) {
            return { ...e, kind: 'review', graduated: true, seq };
        }
        // nextStep is guaranteed < LEARNING_STEPS_MS.length by the check above,
        // but a non-literal index still types as possibly-undefined under
        // noUncheckedIndexedAccess -- the fallback is never actually reached.
        const stepDueInMs = LEARNING_STEPS_MS[nextStep] ?? LEARNING_STEPS_MS[1];
        return {
            ...e,
            kind: 'learning',
            step: nextStep,
            dueAt: now + stepDueInMs,
            graduated: false,
            seq,
        };
    });
    return { entries, nextSeq: s.nextSeq + 1 };
};

export type NextUpResult =
    { kind: 'card'; entry: QueueEntry } | { kind: 'wait'; until: number } | { kind: 'done' };

/**
 * Picks the next card to serve: smallest (dueAt, seq) among non-graduated
 * entries that are due now, or -- if none is due yet -- the soonest one
 * within LEARN_AHEAD_MS (Anki's learn-ahead behaviour: never skip order, but
 * don't idle the learner either). Otherwise reports how long until the
 * soonest entry becomes due, or that the session is fully graduated.
 */
export const nextUp = (s: QueueState, now: number): NextUpResult => {
    const pending = s.entries.filter((e) => !e.graduated);
    if (pending.length === 0) {
        return { kind: 'done' };
    }
    const sorted = [...pending].sort((a, b) => a.dueAt - b.dueAt || a.seq - b.seq);
    // Safe: `pending.length === 0` already returned above, so `sorted` is non-empty.
    const soonest = sorted[0] as QueueEntry;
    if (soonest.dueAt <= now || soonest.dueAt - now <= LEARN_AHEAD_MS) {
        return { kind: 'card', entry: soonest };
    }
    return { kind: 'wait', until: soonest.dueAt };
};

export const pendingCount = (s: QueueState): number => s.entries.filter((e) => !e.graduated).length;

export const graduatedCount = (s: QueueState): number =>
    s.entries.filter((e) => e.graduated).length;

/** Cards that have lapsed (been graded "again") at least once this session. */
export const lapsedCardIds = (s: QueueState): string[] =>
    s.entries.filter((e) => e.lapses > 0).map((e) => e.cardId);
