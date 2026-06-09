import type { Card, Deck } from '@/types/deck';
import { LANGUAGES } from '@/schemas/deck';

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
}

export const toStudyCard = (card: Card, deck: Deck): StudyCard => {
    const lang =
        LANGUAGES.find((l) => l.code === deck.targetLanguage)?.label ??
        deck.targetLanguage.toUpperCase();
    return {
        id: card.id,
        deckId: card.deckId,
        word: card.word,
        reading: card.phonetic,
        meaning: card.definition,
        lang,
        region: deck.targetLanguage.toUpperCase(),
        pos: card.partOfSpeech ?? '',
        example: card.example ?? '',
        exampleTranslation: card.exampleTranslation ?? '',
    };
};
