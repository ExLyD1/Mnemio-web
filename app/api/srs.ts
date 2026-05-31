import { mockStore } from '@/services/mockStore';
import { mockCardProgress } from '@/services/mock';
import { updateCardProgress } from '@/composables/useSpacedRepetition';
import { RATING_TO_QUALITY } from '@/types/srs';
import type { CardProgress, SrsRating } from '@/types/srs';
import type { ApiError } from '@/composables/useAsync';

const key = (userId: string) => mockStore.userKey(userId, 'srs');

const err = (code: string, message: string): ApiError => ({ code, message });

const loadAll = (userId: string): Record<string, CardProgress> =>
    mockStore.get<Record<string, CardProgress>>(key(userId)) ?? {};

const saveAll = (userId: string, progress: Record<string, CardProgress>) =>
    mockStore.set(key(userId), progress);

export const listProgress = async (userId: string): Promise<Record<string, CardProgress>> =>
    loadAll(userId);

export const getProgress = async (
    userId: string,
    cardId: string,
): Promise<CardProgress | null> => {
    const all = loadAll(userId);
    return all[cardId] ?? null;
};

export const rateCard = async (
    userId: string,
    cardId: string,
    deckId: string,
    rating: SrsRating,
): Promise<CardProgress> => {
    if (!cardId) throw err('SRS_NO_CARD', 'No card to rate.');
    const all = loadAll(userId);
    const existing = all[cardId] ?? mockCardProgress(cardId, deckId);
    const updated = updateCardProgress(existing, RATING_TO_QUALITY[rating]);
    all[cardId] = updated;
    saveAll(userId, all);
    return updated;
};

export const ensureProgress = async (
    userId: string,
    cards: { id: string; deckId: string }[],
): Promise<void> => {
    const all = loadAll(userId);
    let changed = false;
    for (const c of cards) {
        if (!all[c.id]) {
            all[c.id] = mockCardProgress(c.id, c.deckId);
            changed = true;
        }
    }
    if (changed) saveAll(userId, all);
};
