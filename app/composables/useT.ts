import messages from '@/i18n/en.json';

type Messages = typeof messages;

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
    const t = (key: string, fallback?: string): string => {
        const value = resolve(messages, key);
        return value ?? fallback ?? key;
    };
    return { t };
};

export type I18nKey = string & { __i18n?: keyof Messages };
