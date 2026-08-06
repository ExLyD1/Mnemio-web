import { http } from '@/utils/http';
import type { CardProgress, SrsRating } from '@/types/srs';
import type { Achievement } from '@/types/achievement';

interface WireProgress {
    cardId: string;
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
    deckId,
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

export const listDue = async (limit = 50): Promise<DueItem[]> => {
    const res = await http<{ items: DueItem[] }>('/srs/due', { query: { limit } });
    return res.items;
};
