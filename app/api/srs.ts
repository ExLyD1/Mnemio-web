import { http } from '@/utils/http';
import type { CardProgress, SrsRating } from '@/types/srs';

interface WireProgress {
    cardId: string;
    repetitions: number;
    interval: number;
    easeFactor: number;
    nextReviewAt: string;
    lastReviewedAt: string | null;
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
): Promise<CardProgress> => {
    const p = await http<WireProgress>('/srs/rate', {
        method: 'POST',
        body: { cardId, rating },
    });
    return toProgress(p, deckId);
};

export const listProgress = async (): Promise<CardProgress[]> => {
    const res = await http<{ items: WireProgress[] }>('/srs/progress');
    return res.items.map((p) => toProgress(p));
};

export const listDue = async (limit = 50): Promise<DueItem[]> => {
    const res = await http<{ items: DueItem[] }>('/srs/due', { query: { limit } });
    return res.items;
};
