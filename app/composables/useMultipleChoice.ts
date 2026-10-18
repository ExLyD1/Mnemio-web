import type { Card } from '@/types/deck';

export interface MultipleChoiceQuestion {
    correctId: string;
    prompt: string;
    options: { id: string; text: string }[];
}

const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = a[i] as T;
        a[i] = a[j] as T;
        a[j] = tmp;
    }
    return a;
};

export const buildMultipleChoice = (
    card: Card,
    pool: Card[],
    optionCount = 4,
): MultipleChoiceQuestion => {
    // Imported Anki decks often hold reversed cards (whose definition is this
    // card's prompt) and sibling clozes sharing one definition, so skip the
    // prompt itself and keep each option text unique.
    const seen = new Set([card.definition, card.word]);
    const distractors: { id: string; text: string }[] = [];
    for (const c of shuffle(pool)) {
        if (distractors.length >= optionCount - 1) {
            break;
        }
        if (c.id === card.id || seen.has(c.definition)) {
            continue;
        }
        seen.add(c.definition);
        distractors.push({ id: c.id, text: c.definition });
    }

    const options = shuffle([{ id: card.id, text: card.definition }, ...distractors]);

    return {
        correctId: card.id,
        prompt: card.word,
        options,
    };
};
