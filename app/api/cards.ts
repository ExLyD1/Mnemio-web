import { http } from '@/utils/http';
import type { Card, CardInput } from '@/types/deck';
import type { Achievement } from '@/types/achievement';

/**
 * CREATE: strip null/undefined so optional fields are omitted and the server
 * applies its own defaults.
 */
const clean = (input: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(input).filter(([, v]) => v !== null && v !== undefined));

/**
 * PATCH: strip only `undefined` ("leave this field alone") and keep `null`
 * ("erase this field"). Stripping null here meant clearing an example or a
 * phonetic silently did nothing — the field was simply omitted from the patch.
 */
const cleanPatch = (input: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));

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
    http<Card>(`/cards/${cardId}`, { method: 'PATCH', body: cleanPatch({ ...input }) });

export const deleteCard = async (cardId: string): Promise<void> => {
    await http<void>(`/cards/${cardId}`, { method: 'DELETE' });
};
