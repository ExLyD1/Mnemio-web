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
        [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
};

export const buildMultipleChoice = (
    card: Card,
    pool: Card[],
    optionCount = 4,
): MultipleChoiceQuestion => {
    const distractors = shuffle(pool.filter((c) => c.id !== card.id && c.definition !== card.definition))
        .slice(0, optionCount - 1)
        .map((c) => ({ id: c.id, text: c.definition }));

    const options = shuffle([
        { id: card.id, text: card.definition },
        ...distractors,
    ]);

    return {
        correctId: card.id,
        prompt: card.word,
        options,
    };
};
