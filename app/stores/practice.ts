import { defineStore, ref } from '#imports';
import type { PracticeResult } from '@/types/practice';

/** Holds the most recent completed-session result for the Session Summary page. */
export const usePracticeStore = defineStore('practice', () => {
    const lastResult = ref<PracticeResult | null>(null);

    const setResult = (result: PracticeResult): void => {
        lastResult.value = result;
    };

    const clear = (): void => {
        lastResult.value = null;
    };

    return { lastResult, setResult, clear };
});
