import { defineStore, ref, computed } from '#imports';
import * as srsApi from '@/api/srs';
import * as decksApi from '@/api/decks';
import { isDue } from '@/composables/useSpacedRepetition';
import { useDecksStore } from '@/stores/decks';
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

    const decks = useDecksStore();
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

    const fetchAll = async () => {
        loading.value = true;
        try {
            if (decks.summaries.length === 0) {
                await decks.fetchList({ cursor: null, append: false });
            }
            // Read decks directly via API so SRS preloading does not overwrite
            // the globally selected deck in the decks store.
            const loaded = await Promise.all(decks.summaries.map((d) => decksApi.getDeck(d.id)));
            const cardToDeck = new Map<string, string>();
            for (const d of loaded) {
                for (const c of d.cards) {
                    cardToDeck.set(c.id, d.id);
                }
            }
            const items = await srsApi.listProgress();
            progress.value = Object.fromEntries(
                items.map((p): [string, CardProgress] => [
                    p.cardId,
                    { ...p, deckId: cardToDeck.get(p.cardId) ?? '' },
                ]),
            );
            rebuildDueQueue(loaded);
        } finally {
            loading.value = false;
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

    return { progress, dueCards, dueCount, nextReviewAt, loading, fetchAll, rate };
});
