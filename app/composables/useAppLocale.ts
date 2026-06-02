import { computed } from 'vue';
import { useI18n } from '#imports';
import { isLocale, DEFAULT_LOCALE, type LocaleCode } from '@/i18n';

export interface LocaleOption {
    code: LocaleCode;
    label: string;
    short: string;
}

export const LOCALE_OPTIONS: LocaleOption[] = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'uk', label: 'Українська', short: 'UA' },
];

/**
 * Thin wrapper over @nuxtjs/i18n: exposes the active locale (narrowed to our
 * supported codes) and a setter that persists via the i18n cookie. Naming it
 * `useAppLocale` avoids any clash with the module's auto-imported helpers.
 */
export const useAppLocale = () => {
    const { locale, setLocale } = useI18n();
    const current = computed<LocaleCode>(() =>
        isLocale(locale.value) ? locale.value : DEFAULT_LOCALE,
    );
    const set = (code: LocaleCode): Promise<void> => setLocale(code);
    return { current, set, options: LOCALE_OPTIONS };
};
