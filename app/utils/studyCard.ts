import type { Card, Deck } from '@/types/deck';
import { LANGUAGES } from '@/schemas/deck';

/**
 * Rich card shown during practice. Real fields (word/definition/phonetic) plus
 * mocked reading/pos/context until the backend grows the model (plan §5.4).
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

const POS = ['noun', 'verb', 'adjective', 'adverb', 'phrase'];

const hash = (s: string): number => {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
};

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
        pos: POS[hash(card.id) % POS.length] ?? 'noun',
        example: `A sentence using “${card.word}”.`,
        exampleTranslation: card.definition,
    };
};
