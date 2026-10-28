import { usePreferencesStore } from '@/stores/preferences';
import { useAsync } from '@/composables/useAsync';
import type { PracticeMode } from '@/types/srs';
import type { FrontSide } from '@/utils/studyCard';

export type PracticeFormat = 'flashcard' | 'multiple-choice';
const FORMAT_KEY = 'mnemio_study_format';
const FRONT_KEY = 'mnemio_front_side';

/**
 * Which side of a flashcard shows before flipping. A per-device choice kept in
 * localStorage; shared state so the Profile setting and every open card agree.
 */
export const useFrontSide = () => {
    const side = useState<FrontSide>('study-front-side', () =>
        import.meta.client && localStorage.getItem(FRONT_KEY) === 'definition'
            ? 'definition'
            : 'term',
    );
    const set = (value: FrontSide) => {
        side.value = value;
        localStorage.setItem(FRONT_KEY, value);
    };
    return { side: readonly(side), set };
};

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
