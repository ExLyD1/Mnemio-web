import { computed } from 'vue';
import { useT } from '@/composables/useT';
import { useTaxonomy } from '@/composables/useTaxonomy';
import { langLabel } from '@/utils/subjects';

/**
 * Localized language names (`languages.<code>`, falling back to the code as
 * shown in caps — "UA" for Ukrainian) and the picker options: the supported
 * languages from the taxonomy, in its order.
 */
export const useLanguageName = () => {
    const { t } = useT();
    const taxonomy = useTaxonomy();
    const name = (code: string | null | undefined): string => langLabel(t, code);
    const options = computed(() =>
        taxonomy.languages.value.map((code) => ({ value: code, label: name(code) })),
    );
    return { name, options };
};
