import { http } from '@/utils/http';
import { normLang } from '@/api/decks';
import { runSse, type StreamError } from '@/utils/sse';
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

// ─── Deck from image ("Вчися з будь-чого") ────────────────────────────────────

export interface DeckFromImageInput {
    image: File;
    /** Language of the generated definitions (default 'en'). */
    sourceLanguage?: string;
    /** Omit to let the model detect the image's language. */
    targetLanguage?: string;
    /** 1–20 upper bound (default 8). */
    count?: number;
    /** ≤300-char refine hint on a re-submit, e.g. "more words", "harder". */
    instructions?: string;
}

export interface DeckFromImageResult {
    provider: string;
    draft: AiDeckDraft;
    /** Present when the image had no readable/learnable text — NOT an error. */
    note?: 'no_text';
}

const buildImageForm = (input: DeckFromImageInput): FormData => {
    const form = new FormData();
    form.append('image', input.image);
    if (input.sourceLanguage) {
        form.append('sourceLanguage', input.sourceLanguage);
    }
    if (input.targetLanguage) {
        form.append('targetLanguage', input.targetLanguage);
    }
    if (input.count !== undefined) {
        form.append('count', String(input.count));
    }
    if (input.instructions?.trim()) {
        form.append('instructions', input.instructions.trim());
    }
    return form;
};

const normDraft = (draft: AiDeckDraft): AiDeckDraft => ({
    ...draft,
    sourceLanguage: normLang(draft.sourceLanguage),
    targetLanguage: normLang(draft.targetLanguage),
});

/** Non-streaming variant — one POST returns the whole draft. */
export const deckFromImage = async (input: DeckFromImageInput): Promise<DeckFromImageResult> => {
    const res = await http<DeckFromImageResult>('/ai/deck-from-image', {
        method: 'POST',
        body: buildImageForm(input),
    });
    return { ...res, draft: normDraft(res.draft) };
};

export interface DeckDraftHeader {
    title: string;
    description: string;
    sourceLanguage: string;
    targetLanguage: string;
    subject?: string;
    glyph?: string;
}

export interface DeckFromImageStreamHandlers {
    onStart?: (e: { provider?: string }) => void;
    onHeader?: (deck: DeckDraftHeader) => void;
    onCard?: (e: { position: number; card: AiDraftCard }) => void;
    onDone?: (e: { note?: 'no_text'; meta?: Record<string, unknown> }) => void;
    onError?: (e: StreamError) => void;
}

/**
 * Streaming variant — emits start → header → card×N → done over SSE so the FE
 * can render the deck shell and stream cards in as they arrive. `done` carries
 * `note: 'no_text'` when the image had nothing learnable (zero card events).
 */
export const streamDeckFromImage = (
    input: DeckFromImageInput,
    handlers: DeckFromImageStreamHandlers,
    signal?: AbortSignal,
): Promise<void> =>
    runSse({
        path: '/ai/deck-from-image',
        query: '?stream=1',
        body: buildImageForm(input),
        signal,
        onError: (e) => handlers.onError?.(e),
        onFrame: (frame) => {
            switch (frame.event) {
                case 'start':
                    handlers.onStart?.(frame.data as { provider?: string });
                    break;
                case 'header': {
                    const deck = (frame.data as { deck: DeckDraftHeader }).deck;
                    handlers.onHeader?.({
                        ...deck,
                        sourceLanguage: normLang(deck.sourceLanguage),
                        targetLanguage: normLang(deck.targetLanguage),
                    });
                    break;
                }
                case 'card':
                    handlers.onCard?.(frame.data as { position: number; card: AiDraftCard });
                    break;
                case 'done':
                    handlers.onDone?.(
                        frame.data as { note?: 'no_text'; meta?: Record<string, unknown> },
                    );
                    break;
                case 'error':
                    handlers.onError?.(frame.data as StreamError);
                    break;
            }
        },
    });

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
