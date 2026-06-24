import { z } from 'zod';

export const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'it', label: 'Italian' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'uk', label: 'Ukrainian' },
    { code: 'pl', label: 'Polish' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ru', label: 'Russian' },
] as const;

const languageCodes = LANGUAGES.map((l) => l.code) as readonly string[];

export const deckSchema = z
    .object({
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
    })
    .refine((data) => data.sourceLanguage !== data.targetLanguage, {
        message: 'deck.errors.languages_same',
        path: ['targetLanguage'],
    });

export type DeckSchema = z.infer<typeof deckSchema>;
