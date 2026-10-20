import { useI18n } from '#imports';
import { catalogs, isLocale, DEFAULT_LOCALE } from '@/i18n';

type Messages = typeof catalogs.en;

const resolve = (obj: unknown, path: string): string | null => {
    const parts = path.split('.');
    let cur: unknown = obj;
    for (const p of parts) {
        if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
            cur = (cur as Record<string, unknown>)[p];
        } else {
            return null;
        }
    }
    return typeof cur === 'string' ? cur : null;
};

export const useT = () => {
    const { locale, t: pluralT } = useI18n({ useScope: 'global' });
    const t = (
        key: string,
        countOrFallback?: number | string,
        named: Record<string, string | number> = {},
    ): string => {
        const code = isLocale(locale.value) ? locale.value : DEFAULT_LOCALE;
        const value = resolve(catalogs[code], key) ?? resolve(catalogs[DEFAULT_LOCALE], key);
        if (typeof countOrFallback === 'number' && value) {
            const args: Record<string, string | number> = { n: countOrFallback, ...named };
            if (value.includes(' | ')) {
                return pluralT(key, args, countOrFallback);
            }
            // Count-invariant wording (e.g. «Карток: {n}») still gets its placeholders.
            return value.replace(/\{(\w+)\}/g, (m, k: string) => String(args[k] ?? m));
        }
        return value ?? (typeof countOrFallback === 'string' ? countOrFallback : key);
    };
    return { t };
};

export type I18nKey = string & { __i18n?: keyof Messages };
