import { ref } from 'vue';
import { useI18n } from '#imports';
import { catalogs, isLocale, DEFAULT_LOCALE } from '@/i18n';
import type { MimiMood } from '@/types/mimi';

type MimiKey = MimiMood | 'suggestions';
type MimiLines = Record<MimiKey, string[]>;

const mimiOf = (code: keyof typeof catalogs): Partial<MimiLines> =>
    ((catalogs[code] as Record<string, unknown>).mimi ?? {}) as Partial<MimiLines>;

const randomOf = (arr: string[] | undefined): string => {
    if (!arr?.length) {
        return '';
    }
    return arr[Math.floor(Math.random() * arr.length)] ?? '';
};

/**
 * Rule-based mascot copy. Lines live in i18n (`mimi.*`) but are read directly
 * from the catalog (per active locale, English fallback) because `useT` only
 * resolves string values, not arrays.
 */
export const useMimi = () => {
    const { locale } = useI18n();
    const mood = ref<MimiMood>('idle');
    const message = ref<string>('');

    const linesFor = (key: MimiKey): string[] => {
        const code = isLocale(locale.value) ? locale.value : DEFAULT_LOCALE;
        return mimiOf(code)[key] ?? mimiOf(DEFAULT_LOCALE)[key] ?? [];
    };

    const pick = (m: MimiMood): string => randomOf(linesFor(m));

    const say = (m: MimiMood): void => {
        mood.value = m;
        message.value = pick(m);
    };

    const clear = (): void => {
        message.value = '';
    };

    const suggestion = (): string => randomOf(linesFor('suggestions'));

    return { mood, message, pick, say, clear, suggestion };
};
