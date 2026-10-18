import { usePreferencesStore } from '@/stores/preferences';
import { useAsync } from '@/composables/useAsync';
import type { PracticeMode } from '@/types/srs';

export type PracticeFormat = 'flashcard' | 'multiple-choice';
const FORMAT_KEY = 'mnemio_study_format';

export const readPracticeFormat = (): PracticeFormat =>
    import.meta.client && localStorage.getItem(FORMAT_KEY) === 'multiple-choice'
        ? 'multiple-choice'
        : 'flashcard';

export const usePracticePreferences = () => {
    const store = usePreferencesStore();
    return {
        store,
        hydrate: useAsync(store.hydrate),
        update: useAsync(store.update),
        saveFormat: (format: PracticeFormat) => localStorage.setItem(FORMAT_KEY, format),
    };
};

export const resolvePracticeMode = (query: Record<string, unknown>): PracticeMode =>
    query.mode === 'know' || (query.mode !== 'srs' && query.srs === '0') ? 'know' : 'srs';
