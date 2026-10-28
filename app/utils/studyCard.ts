import type { Card, Deck } from '@/types/deck';
import { displayLangCode } from '@/utils/subjects';

/**
 * Rich card shown during practice — maps the real backend card fields
 * (word/definition/phonetic/part-of-speech/example) onto the study view.
 */
export interface StudyCard {
    id: string;
    deckId: string;
    word: string;
    reading: string | null;
    meaning: string;
    lang: string;
    region: string;
    pos: string;
    example: string;
    exampleTranslation: string;
    audioUrl: string | null;
    imageUrl: string | null;
    type: Card['type'];
}

export type FrontSide = 'term' | 'definition';

/** Which text the unrevealed face shows first; the back always shows both. */
export const frontTextFor = (c: StudyCard, side: FrontSide): string =>
    side === 'definition' ? c.meaning : c.word;

export const toStudyCard = (card: Card, deck?: Deck | null): StudyCard => {
    const lang = displayLangCode(deck?.targetLanguage);
    return {
        id: card.id,
        deckId: card.deckId,
        word: card.word,
        reading: card.phonetic,
        meaning: card.definition,
        lang,
        region: displayLangCode(deck?.targetLanguage),
        pos: card.partOfSpeech ?? '',
        example: card.example ?? '',
        exampleTranslation: card.exampleTranslation ?? '',
        audioUrl: card.audioUrl,
        imageUrl: card.imageUrl,
        type: card.type,
    };
};
