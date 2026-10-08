import { ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';

export type WordSuggestFetcher = (query: string, signal: AbortSignal) => Promise<string[]>;

/**
 * Debounced, cancellable suggestion dropdown shared by #6 (term completion)
 * and #7 (translation suggestion) — the data source differs (Wiktionary vs
 * MyMemory, via app/api/lexicon.ts) but the keystroke-stream plumbing
 * (debounce, abort stale requests, never let a slow response clobber a newer
 * one, degrade quietly on failure) is identical, so it lives here once.
 *
 * Deliberately NOT built on `useAsync` (app/composables/useAsync.ts) — that
 * primitive has no cancellation and a `shallowRef` meant for one-shot store
 * actions, which is the wrong shape for a per-keystroke stream. `useAsync`
 * stays the rule for store actions; this is the documented exception.
 */
export const useWordSuggest = (
    fetchFn: WordSuggestFetcher,
    opts: { minLength?: number; debounceMs?: number } = {},
) => {
    const minLength = opts.minLength ?? 2;
    const debounceMs = opts.debounceMs ?? 200;

    const items = ref<string[]>([]);
    const loading = ref(false);
    const degraded = ref(false);
    const open = ref(false);
    const highlighted = ref(0);

    // Monotonic token: a slow earlier request must not overwrite a newer one.
    let seq = 0;
    let controller: AbortController | null = null;

    const reset = () => {
        controller?.abort();
        items.value = [];
        open.value = false;
        loading.value = false;
    };

    const run = async (query: string) => {
        const q = query.trim();
        if (q.length < minLength) {
            reset();
            return;
        }
        controller?.abort();
        const mySeq = ++seq;
        const myController = new AbortController();
        controller = myController;
        loading.value = true;
        try {
            const result = await fetchFn(q, myController.signal);
            if (mySeq !== seq) {
                return;
            }
            items.value = result;
            degraded.value = false;
            open.value = result.length > 0;
            highlighted.value = 0;
        } catch {
            if (mySeq !== seq) {
                return;
            }
            // Never let a lookup failure surface as an error in the typing
            // path — just close quietly (an aborted request also lands here,
            // harmlessly, since it's already superseded).
            items.value = [];
            degraded.value = true;
            open.value = false;
        } finally {
            if (mySeq === seq) {
                loading.value = false;
            }
        }
    };

    const search = useDebounceFn(run, debounceMs);

    const dismiss = () => {
        open.value = false;
    };

    /** Call from the input's @keydown. Returns the accepted value, if any. */
    const onKeydown = (e: KeyboardEvent): string | null => {
        if (!open.value || items.value.length === 0) {
            return null;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            highlighted.value = Math.min(highlighted.value + 1, items.value.length - 1);
            return null;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            highlighted.value = Math.max(highlighted.value - 1, 0);
            return null;
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            dismiss();
            return null;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
            const value = items.value[highlighted.value];
            if (!value) {
                return null;
            }
            // Enter would otherwise submit a form; Tab is left alone so focus
            // still advances naturally to the next field after accepting.
            if (e.key === 'Enter') {
                e.preventDefault();
            }
            dismiss();
            return value;
        }
        return null;
    };

    return { items, loading, degraded, open, highlighted, search, dismiss, reset, onKeydown };
};
