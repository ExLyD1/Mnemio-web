import type { DeckCardVM, DeckSummary } from '@/types/deck';
import { swatchFor } from '@/utils/coverSwatches';
import { displayLangCode } from '@/utils/subjects';

/** Build a DeckCard presentation model from a deck summary's embedded stats. */
export const deckToCardVm = (deck: DeckSummary, favorite = false): DeckCardVM => ({
    id: deck.id,
    title: deck.title,
    // Fallback only: SharedDeckCard shows the localized name from `lang`.
    tag: displayLangCode(deck.targetLanguage),
    lang: deck.targetLanguage,
    glyph: deck.glyph ?? undefined,
    total: deck.cardCount,
    masteredPct: deck.stats.masteredPct,
    due: deck.stats.due,
    swatch: deck.coverColor ?? swatchFor(deck.id),
    favorite,
    fromAnki: deck.importedFrom === 'anki',
});
