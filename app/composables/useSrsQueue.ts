import { computed, ref } from 'vue';
import { useSrsStore } from '@/stores/srs';
import { useAsync } from '@/composables/useAsync';
import type { SrsQueueItem, SrsQueue, SrsRating } from '@/types/srs';

const LEARN_AHEAD_MS = 20 * 60 * 1000;

/** Server ordering is preserved; intraday repeats live in a separate timed pile. */
export const useSrsQueue = () => {
    const store = useSrsStore();
    const fetchQueue = useAsync(store.fetchQueue);
    const rate = useAsync(store.rate);
    const queue = ref<SrsQueueItem[]>([]);
    const learning = ref<SrsQueueItem[]>([]);
    const current = ref<SrsQueueItem | null>(null);
    const initial = ref<SrsQueueItem[]>([]);
    const metadata = ref<SrsQueue | null>(null);
    const scheduled = ref<Record<string, string>>({});
    const dueTime = (item: SrsQueueItem) => (item.dueAt ? Date.parse(item.dueAt) : 0);

    const advance = () => {
        learning.value.sort((a, b) => dueTime(a) - dueTime(b));
        const first = learning.value[0];
        if (first && dueTime(first) <= Date.now()) {
            current.value = learning.value.shift() ?? null;
        } else if (queue.value.length) {
            current.value = queue.value.shift() ?? null;
        } else if (first && dueTime(first) <= Date.now() + LEARN_AHEAD_MS) {
            current.value = learning.value.shift() ?? null;
        } else {
            current.value = null;
        }
    };

    const load = async (deckId?: string, extraNew = 0) => {
        const result = await fetchQueue.execute(deckId, extraNew);
        if (!result) {
            return false;
        }
        metadata.value = result;
        scheduled.value = {};
        initial.value = [...result.items];
        queue.value = [];
        learning.value = [];
        for (const item of result.items) {
            if (
                (item.state === 'learning' || item.state === 'relearning') &&
                dueTime(item) > Date.now()
            ) {
                learning.value.push(item);
            } else {
                queue.value.push(item);
            }
        }
        advance();
        return true;
    };

    const submit = async (rating: SrsRating) => {
        const item = current.value;
        if (!item || rate.loading.value) {
            return false;
        }
        const result = await rate.execute(item.card.id, item.card.deckId, rating);
        if (!result) {
            return false;
        } // Keep the visible card and its previews on failure.
        scheduled.value[item.card.id] = result.progress.nextReviewAt;
        if (result.requeueAt && result.previews) {
            learning.value.push({
                card: item.card,
                state: result.progress.state,
                dueAt: result.requeueAt,
                previews: result.previews,
            });
        }
        advance();
        return true;
    };

    const counts = computed(() => {
        const result = { new: 0, learning: 0, review: 0 };
        for (const item of [
            ...queue.value,
            ...learning.value,
            ...(current.value ? [current.value] : []),
        ]) {
            result[item.state === 'relearning' ? 'learning' : item.state] += 1;
        }
        return result;
    });
    const nextDueAt = computed(() => {
        const dates = [
            metadata.value?.nextDueAt,
            ...learning.value.map((item) => item.dueAt),
            ...Object.values(scheduled.value),
        ]
            .filter((date): date is string => !!date && Date.parse(date) > Date.now())
            .sort((a, b) => Date.parse(a) - Date.parse(b));
        return dates[0] ?? null;
    });

    return { current, initial, metadata, counts, nextDueAt, load, submit, fetchQueue, rate };
};
