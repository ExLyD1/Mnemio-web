import { http } from '@/utils/http';
import type { CardDifficulty } from '@/types/deck';

export interface AiDraftCard {
    word: string;
    definition: string;
    phonetic?: string;
    partOfSpeech?: string;
    example?: string;
    exampleTranslation?: string;
    tags?: string[];
    difficulty?: CardDifficulty;
}

export interface AiDeckDraft {
    title: string;
    description: string;
    sourceLanguage: string;
    targetLanguage: string;
    subject?: string;
    glyph?: string;
    cards: AiDraftCard[];
}

export interface GenerateDeckInput {
    topic: string;
    sourceLanguage?: string;
    targetLanguage: string;
    count?: number;
}

export const generateDeck = (
    input: GenerateDeckInput,
): Promise<{ provider: string; draft: AiDeckDraft }> =>
    http('/ai/generate-deck', { method: 'POST', body: input });

export type AiSuggestContext = 'dashboard' | 'deck_detail' | 'review';

export interface AiSuggestion {
    suggestion: string;
    kind: 'tip' | 'deck' | 'review';
    actions: { label: string; href: string }[];
}

export const suggest = (
    context: AiSuggestContext = 'dashboard',
    deckId?: string,
): Promise<AiSuggestion> =>
    http('/ai/suggest', { method: 'POST', body: { context, ...(deckId ? { deckId } : {}) } });
