import { defineStore, ref, computed } from '#imports';
import * as srsApi from '@/api/srs';
import { useAchievementNotifications } from '@/composables/useAchievementNotifications';
import type { CardProgress, SrsRating } from '@/types/srs';
import type { Card } from '@/types/deck';

interface DueCard {
    card: Card;
    progress: CardProgress;
    deckTitle: string;
}

export const useSrsStore = defineStore('srs', () => {
    const progress = ref<Record<string, CardProgress>>({});
    const dueCards = ref<DueCard[]>([]);
    const loading = ref(false);
    // True when some decks failed to load and the queue is therefore incomplete.
    const partial = ref(false);

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
    // /dashboard and /review ask for them on mount.
    const FRESH_MS = 30_000;
    let fetchedAt = 0;
    let inflight: Promise<void> | null = null;

    /**
     * Load the review queue and the progress map.
     *
     * Two requests, not twenty-one: the server assembles the queue (card +
     * progress + deck title) in one query. This used to page through every deck
     * and then GET each deck individually, which also silently dropped any deck
     * past the paging bound.
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
                const [queue, items] = await Promise.all([
                    srsApi.listQueue(),
                    srsApi.listProgress(),
                ]);
                if (seq !== fetchSeq) {
                    return;
                }
                partial.value = false;
                progress.value = Object.fromEntries(
                    items.map((p): [string, CardProgress] => [p.cardId, p]),
                );
                dueCards.value = queue.map((q) => ({
                    card: q.card,
                    progress: {
                        ...q.progress,
                        deckId: q.progress.deckId || q.deckId,
                    } as CardProgress,
                    deckTitle: q.deckTitle,
                }));
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
        const { progress: updated, newAchievements } = await srsApi.rateCard(
            cardId,
            deckId,
            rating,
        );
        progress.value = { ...progress.value, [cardId]: updated };
        dueCards.value = dueCards.value.filter((d) => d.card.id !== cardId);
        notifications.announce(newAchievements);
        return updated;
    };

    return { progress, dueCards, dueCount, nextReviewAt, loading, partial, fetchAll, rate };
});
