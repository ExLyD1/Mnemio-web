import { z } from 'zod';

export const cardSchema = z.object({
    word: z.string().trim().min(1, 'card.errors.word_required').max(120, 'card.errors.word_too_long'),
    definition: z
        .string()
        .trim()
        .min(1, 'card.errors.definition_required')
        .max(500, 'card.errors.definition_too_long'),
    phonetic: z.string().trim().max(120, 'card.errors.phonetic_too_long').nullable().default(null),
});

export type CardSchema = z.infer<typeof cardSchema>;
