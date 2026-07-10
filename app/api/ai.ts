import { http } from '@/utils/http';
import { normLang } from '@/api/decks';
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

export const generateDeck = async (
    input: GenerateDeckInput,
): Promise<{ provider: string; draft: AiDeckDraft }> => {
    const res = await http<{ provider: string; draft: AiDeckDraft }>('/ai/generate-deck', {
        method: 'POST',
        body: input,
    });
    // The model often returns full language names ("English") rather than ISO codes;
    // normalize so the preview + committed deck match the FE's code-keyed selects.
    return {
        ...res,
        draft: {
            ...res.draft,
            sourceLanguage: normLang(res.draft.sourceLanguage),
            targetLanguage: normLang(res.draft.targetLanguage),
        },
    };
};

export type EnrichField =
    'phonetic' | 'partOfSpeech' | 'example' | 'exampleTranslation' | 'tags' | 'difficulty';

export interface EnrichWordsInput {
    /** 1–100 words; the server trims + de-dups before the provider sees them. */
    words: string[];
    /** Language of the generated definitions (e.g. 'en'). */
    sourceLanguage: string;
    /** Language of the input words (e.g. 'es'). */
    targetLanguage: string;
    /** Optional ≤200-char disambiguation hint. */
    context?: string;
    fields?: EnrichField[];
}

export interface EnrichWordsResult {
    provider: string;
    /** Same order as the (de-duped) input words; definition is '' when unfilled. */
    cards: AiDraftCard[];
    meta: {
        requested: number;
        enriched: number;
        durationMs: number;
        tokensInput: number;
        tokensOutput: number;
    };
}

export const enrichWords = (input: EnrichWordsInput): Promise<EnrichWordsResult> =>
    http('/ai/enrich-words', { method: 'POST', body: input });

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
