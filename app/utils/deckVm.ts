import type { DeckCardVM, DeckSummary } from '@/types/deck';
import { swatchFor } from '@/utils/coverSwatches';
import { LANGUAGES } from '@/schemas/deck';

const LANG_LABELS = new Map<string, string>(LANGUAGES.map((l) => [l.code, l.label]));

/** Build a DeckCard presentation model from a deck summary's embedded stats. */
export const deckToCardVm = (deck: DeckSummary, favorite = false): DeckCardVM => ({
    id: deck.id,
    title: deck.title,
    tag: LANG_LABELS.get(deck.targetLanguage) ?? deck.targetLanguage.toUpperCase(),
    glyph: deck.glyph ?? undefined,
    total: deck.cardCount,
    masteredPct: deck.stats.masteredPct,
    due: deck.stats.due,
    swatch: deck.coverColor ?? swatchFor(deck.id),
    favorite,
});
