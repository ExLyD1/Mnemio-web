import { ref } from 'vue';
import messages from '@/i18n/en.json';
import type { MimiMood } from '@/types/mimi';

type MimiLines = Record<MimiMood | 'suggestions', string[]>;

const lines = ((messages as Record<string, unknown>).mimi ?? {}) as Partial<MimiLines>;

const randomOf = (arr: string[] | undefined): string => {
    if (!arr?.length) {
        return '';
    }
    return arr[Math.floor(Math.random() * arr.length)] ?? '';
};

/**
 * Rule-based mascot copy. Lines live in i18n (`mimi.*`) but are read directly
 * from the JSON because `useT` only resolves string values, not arrays.
 */
export const useMimi = () => {
    const mood = ref<MimiMood>('idle');
    const message = ref<string>('');

    const pick = (m: MimiMood): string => randomOf(lines[m]);

    const say = (m: MimiMood): void => {
        mood.value = m;
        message.value = pick(m);
    };

    const clear = (): void => {
        message.value = '';
    };

    const suggestion = (): string => randomOf(lines.suggestions);

    return { mood, message, pick, say, clear, suggestion };
};
