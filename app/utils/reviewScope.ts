import type { SessionCounts } from '@/types/session';
import type { PracticeMode, SrsRating } from '@/types/srs';

/*
 * Review runs (/review) keep no session open while reviewing. Every rating is
 * saved live by POST /srs/rate; the session stats are tallied here per deck and
 * written once at the end — one completed session per deck touched, all sharing
 * a runId so the server pays the +25 bonus once per run.
 *
 * Pure functions only: there is no FE test runner, so the logic stays here,
 * away from the composable's refs and requests.
 */

/* ---------- Scope: which decks a review covers, encoded in the URL ----------
 *
 *   /review                                   hub (also legacy ?pick=1)
 *   /review?decks=all&mode=srs|know           every due card, mixed
 *   /review?decks=<id>&mode=…                 one deck
 *   /review?decks=<id>,<id>&order=…&mode=…    several decks, mixed | by_deck
 */

export type ReviewOrder = 'mixed' | 'by_deck';

export interface ReviewScope {
    /** null = every deck with due cards. */
    deckIds: string[] | null;
    order: ReviewOrder;
    /** null when the URL leaves it to the user's default mode. */
    mode: PracticeMode | null;
}

/** Mirrors the server's cap on GET /srs/queue?deckIds. */
export const MAX_REVIEW_DECKS = 50;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const first = (value: unknown): string | null => {
    const v: unknown = Array.isArray(value) ? (value as unknown[])[0] : value;
    return typeof v === 'string' ? v : null;
};

const parseMode = (value: unknown): PracticeMode | null => {
    const v = first(value);
    return v === 'srs' || v === 'know' ? v : null;
};

/**
 * Read a review scope from the route query. null = show the hub. A legacy
 * `?mode=` link without `decks` means "everything due" (the caller redirects).
 */
export const parseReviewScope = (query: Record<string, unknown>): ReviewScope | null => {
    if (first(query.pick) === '1') {
        return null;
    }
    const decks = first(query.decks);
    const mode = parseMode(query.mode);
    if (decks === null) {
        return mode ? { deckIds: null, order: 'mixed', mode } : null;
    }
    if (decks === 'all') {
        return { deckIds: null, order: 'mixed', mode };
    }
    const ids = [...new Set(decks.split(',').map((id) => id.trim()))]
        .filter((id) => UUID.test(id))
        .slice(0, MAX_REVIEW_DECKS);
    if (!ids.length) {
        return null;
    }
    const order: ReviewOrder =
        ids.length > 1 && first(query.order) === 'by_deck' ? 'by_deck' : 'mixed';
    return { deckIds: ids, order, mode };
};

/** The /review query for a scope (the inverse of parseReviewScope). */
export const reviewScopeQuery = (scope: ReviewScope): Record<string, string> => ({
    decks: scope.deckIds?.length ? scope.deckIds.join(',') : 'all',
    ...(scope.order === 'by_deck' && (scope.deckIds?.length ?? 0) > 1 ? { order: 'by_deck' } : {}),
    ...(scope.mode ? { mode: scope.mode } : {}),
});

/**
 * Group queue items deck by deck in the given deck order, keeping the server's
 * order within each deck. Decks missing from `deckIds` go last.
 */
export const orderByDeck = <T extends { card: { deckId: string } }>(
    items: T[],
    deckIds: string[],
): T[] => {
    const rank = new Map(deckIds.map((id, i) => [id, i]));
    const at = (item: T) => rank.get(item.card.deckId) ?? deckIds.length;
    return items
        .map((item, i) => ({ item, i }))
        .sort((a, b) => at(a.item) - at(b.item) || a.i - b.i)
        .map(({ item }) => item);
};

/* ---------- Run recording ---------- */

/** The server caps cardIds and revisitCardIds at 1000 per session. */
const MAX_SESSION_CARDS = 1000;

export interface DeckTally {
    deckId: string;
    /** Distinct cards answered from this deck, in the order first answered. */
    cardIds: string[];
    counts: SessionCounts;
    correct: number;
    /** Cards whose latest answer was "again". */
    revisitCardIds: string[];
    activeMs: number;
    /** Position in the run at which this deck was first touched. */
    order: number;
}

export type RunTallies = Record<string, DeckTally>;

/** A UUID for POST /sessions `runId` (the server validates the format). */
export const newRunId = (): string => {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
    b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
    const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

/** Record one answer against its deck. Returns a new tallies object. */
export const tallyAnswer = (
    tallies: RunTallies,
    card: { id: string; deckId: string },
    rating: SrsRating,
    activeMs: number,
): RunTallies => {
    const prev = tallies[card.deckId];
    const base: DeckTally = prev ?? {
        deckId: card.deckId,
        cardIds: [],
        counts: { again: 0, hard: 0, good: 0, easy: 0 },
        correct: 0,
        revisitCardIds: [],
        activeMs: 0,
        order: Object.keys(tallies).length,
    };
    const correct = rating !== 'again';
    const revisit = base.revisitCardIds.filter((id) => id !== card.id);
    return {
        ...tallies,
        [card.deckId]: {
            ...base,
            cardIds: base.cardIds.includes(card.id) ? base.cardIds : [...base.cardIds, card.id],
            counts: { ...base.counts, [rating]: base.counts[rating] + 1 },
            correct: base.correct + (correct ? 1 : 0),
            revisitCardIds: correct ? revisit : [...revisit, card.id],
            activeMs: base.activeMs + Math.max(0, activeMs),
        },
    };
};

/**
 * The decks still to write, in order of first touch, with the deck the user was
 * on last written last (so it becomes the dashboard's "last practiced deck").
 */
export const flushPlan = (
    tallies: RunTallies,
    lastDeckId: string | null,
    written: ReadonlySet<string> = new Set(),
): DeckTally[] =>
    Object.values(tallies)
        .filter((tally) => tally.cardIds.length > 0 && !written.has(tally.deckId))
        .sort(
            (a, b) =>
                Number(a.deckId === lastDeckId) - Number(b.deckId === lastDeckId) ||
                a.order - b.order,
        );

/** POST /sessions body for one deck's tally. */
export const tallyStart = (tally: DeckTally) => ({
    deckId: tally.deckId,
    cardIds: tally.cardIds.slice(0, MAX_SESSION_CARDS),
});

/** POST /sessions/:id/complete snapshot for one deck's tally. */
export const tallySnapshot = (tally: DeckTally) => ({
    correct: tally.correct,
    counts: { ...tally.counts },
    revisitCardIds: tally.revisitCardIds.slice(0, MAX_SESSION_CARDS),
    durationMs: Math.round(tally.activeMs),
});

/**
 * How long to wait before retrying a 429. The server reports `retryAfter` as
 * @fastify/rate-limit's human string ("38 seconds", "1 minute"); unknown shapes
 * fall back to a short pause. Capped so a flush never stalls for long.
 */
export const retryDelayMs = (details: Record<string, unknown> | undefined): number => {
    const raw = details?.retryAfter;
    if (typeof raw === 'number' && Number.isFinite(raw)) {
        return Math.min(60_000, Math.max(0, raw * 1000));
    }
    const match =
        typeof raw === 'string' ? /([\d.]+)\s*(ms|millisecond|second|minute)/.exec(raw) : null;
    if (!match) {
        return 2000;
    }
    const n = Number(match[1]);
    const unit = match[2] === 'minute' ? 60_000 : match[2] === 'second' ? 1000 : 1;
    return Math.min(60_000, n * unit);
};
