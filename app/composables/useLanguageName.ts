import { computed } from 'vue';
import { useT } from '@/composables/useT';
import { LANGUAGES } from '@/schemas/deck';

/**
 * Localized language names. LANGUAGES only carries English labels, so the
 * Ukrainian UI showed "English", "Ukrainian · 20 cards", raw "en" pills, etc.
 * (QA (2) #2 / (3) #12 "translation drops", (3) #13).
 */
export const useLanguageName = () => {
    const { t } = useT();
    const name = (code: string | null | undefined): string => {
        const c = (code ?? '').toLowerCase();
        if (!c) {
            return '';
        }
        const fallback = LANGUAGES.find((l) => l.code === c)?.label ?? c.toUpperCase();
        return t(`languages.${c}`, fallback);
    };
    const options = computed(() => LANGUAGES.map((l) => ({ value: l.code, label: name(l.code) })));
    return { name, options };
};
