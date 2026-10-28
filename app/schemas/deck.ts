import { z } from 'zod';
import { SUBJECTS, SUPPORTED_LANGS } from '@/utils/subjects';

// The backend's 28 codes (GET /public/taxonomy serves the same list; the
// pickers offer it from there).
const languageCodes: readonly string[] = SUPPORTED_LANGS;

// Source and target may match: a monolingual deck (e.g. English words with
// English definitions) is a legitimate way to learn.
export const deckSchema = z.object({
    title: z
        .string()
        .trim()
        .min(2, 'deck.errors.title_too_short')
        .max(120, 'deck.errors.title_too_long'),
    description: z
        .string()
        .trim()
        .max(500, 'deck.errors.description_too_long')
        .nullable()
        .default(null),
    sourceLanguage: z
        .string()
        .refine((v) => languageCodes.includes(v), 'deck.errors.language_invalid'),
    targetLanguage: z
        .string()
        .refine((v) => languageCodes.includes(v), 'deck.errors.language_invalid'),
    isPublic: z.boolean().default(true),
    subject: z.enum(SUBJECTS).default('other'),
});

export type DeckSchema = z.infer<typeof deckSchema>;
