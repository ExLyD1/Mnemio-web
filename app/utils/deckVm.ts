import type { DeckAuthor, DeckCardVM, DeckSummary } from '@/types/deck';
import { swatchFor } from '@/utils/coverSwatches';
import { displayLangCode } from '@/utils/subjects';

/** "@username", else the full name, else '' (the card then says "someone"). */
export const authorHandle = (author: DeckAuthor | null | undefined): string =>
    author?.username ? `@${author.username}` : (author?.fullName ?? '');

/**
 * Build a DeckCard presentation model from a deck summary's embedded stats.
 * Library decks pass `author` / `isOwner` through (someone else's deck shows
 * "by …" and no authoring actions).
 */
export const deckToCardVm = (
    deck: DeckSummary & { author?: DeckAuthor; isOwner?: boolean },
    favorite = false,
): DeckCardVM => ({
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
    ...(deck.isOwner === false ? { isOwner: false, author: authorHandle(deck.author) } : {}),
});
