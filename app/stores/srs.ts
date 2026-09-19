import { defineStore, ref, computed } from '#imports';
import * as srsApi from '@/api/srs';
import * as decksApi from '@/api/decks';
import { isDue } from '@/composables/useSpacedRepetition';
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

    const rebuildDueQueue = (decksWithCards: { id: string; title: string; cards: Card[] }[]) => {
        const map = new Map<string, { title: string; cards: Card[] }>();
        for (const d of decksWithCards) {
            map.set(d.id, { title: d.title, cards: d.cards });
        }
        const items: DueCard[] = [];
        for (const p of Object.values(progress.value)) {
            if (!isDue(p)) {
                continue;
            }
            const deck = map.get(p.deckId);
            const card = deck?.cards.find((c) => c.id === p.cardId);
            if (deck && card) {
                items.push({ card, progress: p, deckTitle: deck.title });
            }
        }
        items.sort(
            (a, b) =>
                new Date(a.progress.nextReviewAt).getTime() -
                new Date(b.progress.nextReviewAt).getTime(),
        );
        dueCards.value = items;
    };

    // Every deck the user owns, not just the first page. The due queue is built
    // from these, and reading only `decks.summaries` (page size 20) made cards
    // in the 21st deck onward unreachable in /review — while the header's "N
    // due" came from the server and counted them, so the two disagreed on the
    // same screen.
    const listAllDeckSummaries = async () => {
        const all: { id: string }[] = [];
        let cursor: string | null = null;
        // Bounded so a malformed cursor can never spin forever.
        for (let page = 0; page < 50; page += 1) {
            const res = await decksApi.listDecks({ cursor, limit: 100 });
            all.push(...res.items);
            cursor = res.nextCursor;
            if (!cursor) {
                break;
            }
        }
        return all;
    };

    // Monotonic token: a slow earlier fetch must not overwrite a newer one.
    let fetchSeq = 0;
    const fetchAll = async () => {
        const seq = ++fetchSeq;
        loading.value = true;
        try {
            const summaries = await listAllDeckSummaries();
            // Read decks directly via API so SRS preloading does not overwrite
            // the globally selected deck in the decks store.
            const settled = await Promise.allSettled(summaries.map((d) => decksApi.getDeck(d.id)));
            if (seq !== fetchSeq) {
                return;
            }

            const loaded = settled
                .filter(
                    (
                        r,
                    ): r is PromiseFulfilledResult<Awaited<ReturnType<typeof decksApi.getDeck>>> =>
                        r.status === 'fulfilled',
                )
                .map((r) => r.value);
            // A partial failure used to be swallowed whole, rendering decks as
            // completely unstudied. Keep what loaded, but say so.
            partial.value = loaded.length !== summaries.length;

            const cardToDeck = new Map<string, string>();
            for (const d of loaded) {
                for (const c of d.cards) {
                    cardToDeck.set(c.id, d.id);
                }
            }
            const items = await srsApi.listProgress();
            if (seq !== fetchSeq) {
                return;
            }

            progress.value = Object.fromEntries(
                items.map((p): [string, CardProgress] => [
                    p.cardId,
                    // The server now reports deckId on each progress row; the
                    // card->deck map is only a fallback for older responses.
                    {
                        ...p,
                        deckId: p.deckId !== '' ? p.deckId : (cardToDeck.get(p.cardId) ?? ''),
                    },
                ]),
            );
            rebuildDueQueue(loaded);
        } finally {
            if (seq === fetchSeq) {
                loading.value = false;
            }
        }
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
