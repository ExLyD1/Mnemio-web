import { defineStore, ref, computed } from '#imports';
import * as srsApi from '@/api/srs';
import { useAchievementNotifications } from '@/composables/useAchievementNotifications';
import { isDue } from '@/composables/useSpacedRepetition';
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

    // Which decks Practice (/review) is currently scoped to. `null` = every
    // deck ("practice all"). Selection lives here (not page-local) so the
    // sidebar's dueCount and the dashboard stay unaffected by it — see
    // `dueCount` below, which is deliberately unfiltered.
    const selectedDeckIds = ref<string[] | null>(null);

    // Grabbed once at store setup (valid Vue/i18n context) and reused inside
    // `rate()` after its await — see useAchievementNotifications.ts.
    const notifications = useAchievementNotifications();

    // Account-wide due count — NOT filtered by selectedDeckIds. AppRail's badge
    // and the dashboard read this and must keep showing the true total
    // regardless of what the user is currently practising.
    const dueCount = computed(() => dueCards.value.length);

    const activeQueue = computed(() => {
        const ids = selectedDeckIds.value;
        return ids === null
            ? dueCards.value
            : dueCards.value.filter((d) => ids.includes(d.progress.deckId));
    });
    const activeDueCount = computed(() => activeQueue.value.length);

    /** deckId -> due count, grouped straight from the queue (one source of truth
     * with what a practice session will actually serve — stats.due on the deck
     * summary can drift from this by up to FRESH_MS). */
    const dueByDeck = computed(() => {
        const map = new Map<string, number>();
        for (const d of dueCards.value) {
            map.set(d.progress.deckId, (map.get(d.progress.deckId) ?? 0) + 1);
        }
        return map;
    });

    const selectDecks = (ids: string[] | null) => {
        selectedDeckIds.value = ids;
    };

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
                // 2000 is the backend's ceiling (srs.schema.ts queueQuerySchema) —
                // the per-deck picker (Practice) needs the WHOLE account queue to
                // group counts correctly, not just the first 500.
                const [queue, items] = await Promise.all([
                    srsApi.listQueue(2000),
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
        // Only drop the card once the SERVER says it's no longer due. The old
        // unconditional filter removed a card on every rating, including
        // "Forgot" — which is why /review ended a session instead of letting
        // the card come back. The in-session relearning queue (srsQueue.ts)
        // decides re-showing within a session; this store only reflects what
        // the server's own schedule says.
        if (!isDue(updated)) {
            dueCards.value = dueCards.value.filter((d) => d.card.id !== cardId);
        }
        notifications.announce(newAchievements);
        return updated;
    };

    return {
        progress,
        dueCards,
        dueCount,
        selectedDeckIds,
        activeQueue,
        activeDueCount,
        dueByDeck,
        selectDecks,
        nextReviewAt,
        loading,
        partial,
        fetchAll,
        rate,
    };
});
