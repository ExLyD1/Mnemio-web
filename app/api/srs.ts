import { http } from '@/utils/http';
import type { CardProgress, SrsRating } from '@/types/srs';
import type { Card } from '@/types/deck';
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
}

// POST /srs/rate additionally reports achievements unlocked by this rating —
// see docs/api-contract.md.
interface WireRateResult extends WireProgress {
    newAchievements: Achievement[];
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
});

export const rateCard = async (
    cardId: string,
    deckId: string,
    rating: SrsRating,
): Promise<{ progress: CardProgress; newAchievements: Achievement[] }> => {
    const p = await http<WireRateResult>('/srs/rate', {
        method: 'POST',
        body: { cardId, rating },
    });
    return { progress: toProgress(p, deckId), newAchievements: p.newAchievements };
};

export const listProgress = async (): Promise<CardProgress[]> => {
    const res = await http<{ items: WireProgress[] }>('/srs/progress');
    return res.items.map((p) => toProgress(p));
};

/**
 * The whole review queue in one request: card + progress + deck title. The
 * client used to assemble this by listing every deck and then fetching each one
 * individually — 20+ requests on every /review and /dashboard mount.
 */
export interface QueueItem {
    card: Card;
    progress: WireProgress & { deckId: string };
    deckId: string;
    deckTitle: string;
}

export const listQueue = async (limit = 500): Promise<QueueItem[]> => {
    const res = await http<{ items: QueueItem[] }>('/srs/queue', { query: { limit } });
    return res.items;
};

export const listDue = async (limit = 50): Promise<DueItem[]> => {
    const res = await http<{ items: DueItem[] }>('/srs/due', { query: { limit } });
    return res.items;
};
