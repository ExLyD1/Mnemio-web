import type { DeckCardVM, DeckSummary } from '@/types/deck';
import { swatchFor } from '@/utils/coverSwatches';
import { LANGUAGES } from '@/schemas/deck';

const LANG_LABELS = new Map<string, string>(LANGUAGES.map((l) => [l.code, l.label]));

/** Build a DeckCard presentation model from a summary plus derived stats. */
export const deckToCardVm = (
    deck: DeckSummary,
    stats: { masteredPct: number; due: number },
    favorite = false,
): DeckCardVM => ({
    id: deck.id,
    title: deck.title,
    tag: LANG_LABELS.get(deck.targetLanguage) ?? deck.targetLanguage.toUpperCase(),
    total: deck.cardCount,
    masteredPct: stats.masteredPct,
    due: stats.due,
    swatch: swatchFor(deck.id),
    favorite,
});
