import { defineStore, ref } from '#imports';
import type { PracticeResult, PracticeResultSummary } from '@/types/practice';

/** Holds the most recent completed-session result for the Session Summary page. */
export const usePracticeStore = defineStore('practice', () => {
    const lastResult = ref<PracticeResult | null>(null);
    const previousResult = ref<PracticeResultSummary | null>(null);

    const setResult = (result: PracticeResult): void => {
        lastResult.value = result;
        previousResult.value = null;

        if (!import.meta.client) {
            return;
        }

        const key = `mnemio:lastResult:${result.deckId}`;
        try {
            const stored = localStorage.getItem(key);
            const summary: unknown = stored ? JSON.parse(stored) : null;
            if (summary && typeof summary === 'object') {
                const entry = summary as Record<string, unknown>;
                if (
                    typeof entry.reviewed === 'number' &&
                    Number.isInteger(entry.reviewed) &&
                    entry.reviewed >= 0 &&
                    typeof entry.correct === 'number' &&
                    Number.isInteger(entry.correct) &&
                    entry.correct >= 0 &&
                    entry.correct <= entry.reviewed &&
                    typeof entry.timeMs === 'number' &&
                    Number.isFinite(entry.timeMs) &&
                    entry.timeMs >= 0 &&
                    typeof entry.timestamp === 'number' &&
                    Number.isFinite(entry.timestamp) &&
                    entry.timestamp > 0
                ) {
                    previousResult.value = {
                        reviewed: entry.reviewed,
                        correct: entry.correct,
                        timeMs: entry.timeMs,
                        timestamp: entry.timestamp,
                    };
                }
            }
        } catch {
            // Missing access or malformed storage must not interrupt the results page.
        }

        try {
            const summary: PracticeResultSummary = {
                reviewed: result.reviewed,
                correct: result.correct,
                timeMs: result.timeMs,
                timestamp: Date.now(),
            };
            localStorage.setItem(key, JSON.stringify(summary));
        } catch {
            // The session still completes when storage is unavailable or full.
        }
    };

    const clear = (): void => {
        lastResult.value = null;
        previousResult.value = null;
    };

    return { lastResult, previousResult, setResult, clear };
});
