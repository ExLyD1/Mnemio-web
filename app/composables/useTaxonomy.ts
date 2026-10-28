import { computed, useState } from '#imports';
import { getTaxonomy } from '@/api/taxonomy';
import { SUBJECTS, SUPPORTED_LANGS, isSubject, type Subject } from '@/utils/subjects';
import type { Taxonomy } from '@/types/taxonomy';

/**
 * The backend-served subject and language lists, fetched once per app and
 * shared through `useState` (so an SSR fetch rides the payload). Until it
 * loads, or if it fails, the lists fall back to the constants compiled into
 * `utils/subjects.ts`; `legacySubjects` is then empty.
 *
 * SSR pages: `await useAsyncData('taxonomy', () => taxonomy.ensure())`.
 * Client components: call `ensure()` in `onMounted` (it never throws).
 */
export const useTaxonomy = () => {
    const state = useState<Taxonomy | null>('taxonomy', () => null);

    const ensure = async (): Promise<Taxonomy | null> => {
        if (!state.value) {
            try {
                state.value = await getTaxonomy();
            } catch {
                // Fallback lists below; the next ensure() retries.
            }
        }
        return state.value;
    };

    const subjects = computed<Subject[]>(() => {
        const list = state.value?.subjects.filter(isSubject);
        return list?.length ? list : [...SUBJECTS];
    });
    const languages = computed<string[]>(() =>
        state.value?.languages.length ? state.value.languages : [...SUPPORTED_LANGS],
    );
    const legacySubjects = computed<Record<string, Subject>>(
        () => state.value?.legacySubjects ?? {},
    );

    return { subjects, languages, legacySubjects, ensure };
};
