import { useT } from '@/composables/useT';
import { useAppLocale } from '@/composables/useAppLocale';
import type { ApiError } from '@/composables/useAsync';

type ErrorLike = Partial<Pick<ApiError, 'code' | 'message'>> | null | undefined;

/**
 * Turns an API error into user-facing text in the app language. The backend
 * always answers in English, so never toast `err.message` directly — look the
 * stable `code` up in the `errors.*` catalog instead.
 */
export const useApiError = () => {
    const { t } = useT();
    const { current } = useAppLocale();

    const apiErrorText = (err: ErrorLike, fallbackKey = 'errors.generic'): string => {
        const code = err?.code;
        // Validation messages are field-specific and more helpful than the
        // generic catalog line, but they are English — only show them raw in EN.
        if (code === 'VALIDATION_ERROR' && current.value === 'en' && err?.message) {
            return err.message;
        }
        if (code) {
            const text = t(`errors.${code}`, '');
            if (text) {
                return text;
            }
        }
        return t(fallbackKey);
    };

    return { apiErrorText };
};
