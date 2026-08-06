import { http } from '@/utils/http';
import type { Card, CardInput } from '@/types/deck';
import type { Achievement } from '@/types/achievement';

/** Strip null/undefined so optional fields are omitted, not sent as null. */
const clean = (input: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(input).filter(([, v]) => v !== null && v !== undefined));

// POST /decks/:id/cards(/bulk) additionally report achievements unlocked by
// this create — see docs/api-contract.md.
export const addCard = async (
    deckId: string,
    input: CardInput,
): Promise<Card & { newAchievements: Achievement[] }> =>
    http<Card & { newAchievements: Achievement[] }>(`/decks/${deckId}/cards`, {
        method: 'POST',
        body: clean({ ...input }),
    });

export const bulkAddCards = async (
    deckId: string,
    cards: CardInput[],
): Promise<{ created: number; newAchievements: Achievement[] }> =>
    http<{ created: number; newAchievements: Achievement[] }>(`/decks/${deckId}/cards/bulk`, {
        method: 'POST',
        body: { cards: cards.map((c) => clean({ ...c })) },
    });

export const updateCard = async (cardId: string, input: Partial<CardInput>): Promise<Card> =>
    http<Card>(`/cards/${cardId}`, { method: 'PATCH', body: clean({ ...input }) });

export const deleteCard = async (cardId: string): Promise<void> => {
    await http<void>(`/cards/${cardId}`, { method: 'DELETE' });
};
