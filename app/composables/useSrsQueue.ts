import { computed, ref } from 'vue';
import { useSrsStore } from '@/stores/srs';
import { useAsync } from '@/composables/useAsync';
import { orderByDeck, type ReviewOrder } from '@/utils/reviewScope';
import type { SrsQueueItem, SrsQueue, SrsRating } from '@/types/srs';

const LEARN_AHEAD_MS = 20 * 60 * 1000;

export interface QueueLoadOptions {
    deckId?: string;
    deckIds?: string[];
    extraNew?: number;
    order?: ReviewOrder;
}

/**
 * Server ordering is preserved; intraday repeats live in a separate timed pile.
 * In `by_deck` order the decks run back to back: each deck's due learning, its
 * queue, then its learning within the learn-ahead window, before the next deck.
 * Learning cards left after the last deck fall back to the normal order.
 */
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
    // by_deck: the deck order and which deck is being served.
    const deckOrder = ref<string[]>([]);
    const deckIndex = ref(0);
    const currentDeckId = computed(() => deckOrder.value[deckIndex.value] ?? null);

    const takeFrom = (pile: SrsQueueItem[], match: (item: SrsQueueItem) => boolean) => {
        const i = pile.findIndex(match);
        return i === -1 ? null : (pile.splice(i, 1)[0] ?? null);
    };
    const nextInDeck = (deckId: string) => {
        const now = Date.now();
        const inDeck = (item: SrsQueueItem) => item.card.deckId === deckId;
        return (
            takeFrom(learning.value, (item) => inDeck(item) && dueTime(item) <= now) ??
            takeFrom(queue.value, inDeck) ??
            takeFrom(
                learning.value,
                (item) => inDeck(item) && dueTime(item) <= now + LEARN_AHEAD_MS,
            )
        );
    };

    const advance = () => {
        learning.value.sort((a, b) => dueTime(a) - dueTime(b));
        while (deckIndex.value < deckOrder.value.length) {
            const deckId = deckOrder.value[deckIndex.value];
            const item = deckId ? nextInDeck(deckId) : null;
            if (item) {
                current.value = item;
                return;
            }
            deckIndex.value += 1;
        }
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

    const load = async (opts: QueueLoadOptions = {}) => {
        const result = await fetchQueue.execute({
            deckId: opts.deckId,
            deckIds: opts.deckIds,
            extraNew: opts.extraNew ?? 0,
        });
        if (!result) {
            return false;
        }
        metadata.value = result;
        scheduled.value = {};
        const byDeck = opts.order === 'by_deck' && !!opts.deckIds?.length;
        deckOrder.value = byDeck ? [...(opts.deckIds ?? [])] : [];
        deckIndex.value = 0;
        initial.value = byDeck ? orderByDeck(result.items, deckOrder.value) : [...result.items];
        queue.value = [];
        learning.value = [];
        for (const item of initial.value) {
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

    return {
        current,
        currentDeckId,
        initial,
        metadata,
        counts,
        nextDueAt,
        load,
        submit,
        fetchQueue,
        rate,
    };
};
