import { http } from '@/utils/http';
import type { CardProgress, SrsRating, SrsState, SrsQueue, Previews } from '@/types/srs';
import type { Achievement } from '@/types/achievement';

interface WireProgress {
    cardId: string;
    // GET /srs/progress reports the owning deck per row; POST /srs/rate does
    // not (the caller already knows which deck it rated in).
    deckId?: string;
    repetitions: number;
    interval: number;
    easeFactor: number;
    nextReviewAt: string;
    lastReviewedAt: string | null;
    state: SrsState;
    lapses: number;
    leeched: boolean;
    remainingSteps: number;
    reps: number;
}

// POST /srs/rate additionally reports achievements unlocked by this rating —
// see docs/api-contract.md.
interface WireRateResult extends WireProgress {
    newAchievements: Achievement[];
    requeueAt: string | null;
    previews: Previews | null;
}

export interface DueItem {
    cardId: string;
    deckId: string;
    word: string;
    definition: string;
    phonetic: string | null;
    nextReviewAt: string;
    interval: number;
    easeFactor: number;
    repetitions: number;
}

const toProgress = (p: WireProgress, deckId = ''): CardProgress => ({
    cardId: p.cardId,
    // An explicit argument wins; otherwise take the server's value. Both may be
    // empty strings, so this is an emptiness check, not a nullish one.
    deckId: deckId !== '' ? deckId : (p.deckId ?? ''),
    easeFactor: p.easeFactor,
    intervalDays: p.interval,
    repetitions: p.repetitions,
    nextReviewAt: p.nextReviewAt,
    lastReviewedAt: p.lastReviewedAt,
    state: p.state,
    lapses: p.lapses,
    leeched: p.leeched,
    remainingSteps: p.remainingSteps,
    reps: p.reps,
});

export const rateCard = async (
    cardId: string,
    deckId: string,
    rating: SrsRating,
): Promise<{
    progress: CardProgress;
    newAchievements: Achievement[];
    requeueAt: string | null;
    previews: Previews | null;
}> => {
    const p = await http<WireRateResult>('/srs/rate', {
        method: 'POST',
        body: { cardId, rating },
    });
    return {
        progress: toProgress(p, deckId),
        newAchievements: p.newAchievements,
        requeueAt: p.requeueAt,
        previews: p.previews,
    };
};

/**
 * The study queue in one request (the http util sends X-Timezone, which sets
 * the server's day rollover). With a deck it also holds that deck's new cards.
 */
export const getQueue = (deckId?: string, extraNew = 0): Promise<SrsQueue> =>
    http<SrsQueue>('/srs/queue', { query: { deckId, extraNew } });

export const listProgress = async (): Promise<CardProgress[]> => {
    const res = await http<{ items: WireProgress[] }>('/srs/progress');
    return res.items.map((p) => toProgress(p));
};

export const listDue = async (limit = 50): Promise<DueItem[]> => {
    const res = await http<{ items: DueItem[] }>('/srs/due', { query: { limit } });
    return res.items;
};
