import { defineStore, ref, computed } from '#imports';
import * as srsApi from '@/api/srs';
import { useAchievementNotifications } from '@/composables/useAchievementNotifications';
import type { CardProgress, SrsRating, SrsQueueItem } from '@/types/srs';

export const useSrsStore = defineStore('srs', () => {
    const progress = ref<Record<string, CardProgress>>({});
    const dueCards = ref<SrsQueueItem[]>([]);
    const loading = ref(false);

    // Grabbed once at store setup (valid Vue/i18n context) and reused inside
    // `rate()` after its await — see useAchievementNotifications.ts.
    const notifications = useAchievementNotifications();

    const dueCount = computed(() => dueCards.value.length);

    const nextReviewAt = computed(() => {
        const upcoming = Object.values(progress.value)
            .map((p) => new Date(p.nextReviewAt).getTime())
            .filter((t) => t > Date.now());
        if (!upcoming.length) {
            return null;
        }
        return new Date(Math.min(...upcoming)).toISOString();
    });

    // Monotonic token: a slow earlier fetch must not overwrite a newer one.
    let fetchSeq = 0;
    // The queue and the progress map change rarely between mounts, and both
    // /dashboard and the deck page ask for them on mount.
    const FRESH_MS = 30_000;
    let fetchedAt = 0;
    let inflight: Promise<void> | null = null;

    /**
     * Load the due queue and the progress map: two requests, the server
     * assembles the queue (card + state + previews + deck title) in one query.
     */
    const fetchAll = async (opts: { force?: boolean } = {}) => {
        if (!opts.force && fetchedAt && Date.now() - fetchedAt < FRESH_MS) {
            return;
        }
        if (inflight) {
            return inflight;
        }
        const seq = ++fetchSeq;
        loading.value = true;
        const run = async () => {
            try {
                const [items, queue] = await Promise.all([
                    srsApi.listProgress(),
                    srsApi.getQueue(),
                ]);
                if (seq !== fetchSeq) {
                    return;
                }
                progress.value = Object.fromEntries(
                    items.map((p): [string, CardProgress] => [p.cardId, p]),
                );
                dueCards.value = queue.items;
                fetchedAt = Date.now();
            } finally {
                if (seq === fetchSeq) {
                    loading.value = false;
                }
            }
        };
        inflight = run().finally(() => {
            inflight = null;
        });
        return inflight;
    };

    const rate = async (cardId: string, deckId: string, rating: SrsRating) => {
        const result = await srsApi.rateCard(cardId, deckId, rating);
        // A rating supersedes any fetch still in flight.
        fetchSeq += 1;
        loading.value = false;
        progress.value = { ...progress.value, [cardId]: result.progress };
        const previous = dueCards.value.find((item) => item.card.id === cardId);
        dueCards.value = dueCards.value.filter((item) => item.card.id !== cardId);
        // Still in an intraday learning step: it comes back later today.
        if (previous && result.requeueAt && result.previews) {
            dueCards.value.push({
                ...previous,
                state: result.progress.state,
                dueAt: result.requeueAt,
                previews: result.previews,
            });
        }
        notifications.announce(result.newAchievements);
        return result;
    };

    const fetchQueue = (deckId?: string, extraNew = 0) => srsApi.getQueue(deckId, extraNew);

    return { progress, dueCards, dueCount, nextReviewAt, loading, fetchAll, rate, fetchQueue };
});
