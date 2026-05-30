import { defineStore, ref, computed } from '#imports';
import * as srsApi from '@/api/srs';
import { isDue } from '@/composables/useSpacedRepetition';
import { useAuthStore } from '@/stores/auth';
import { useDecksStore } from '@/stores/decks';
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

    const auth = useAuthStore();
    const decks = useDecksStore();

    const userId = computed(() => auth.currentUser?.id ?? null);

    const requireUser = (): string => {
        const id = userId.value;
        if (!id) throw { code: 'AUTH_NOT_AUTHENTICATED', message: 'Not signed in.' };
        return id;
    };

    const dueCount = computed(() => dueCards.value.length);

    const nextReviewAt = computed(() => {
        const upcoming = Object.values(progress.value)
            .map((p) => new Date(p.nextReviewAt).getTime())
            .filter((t) => t > Date.now())
            .sort((a, b) => a - b);
        return upcoming.length ? new Date(upcoming[0]!).toISOString() : null;
    });

    const fetchAll = async () => {
        const id = requireUser();
        loading.value = true;
        try {
            if (decks.summaries.length === 0) {
                await decks.fetchList({ cursor: null, append: false });
            }
            const allDeckIds = decks.summaries.map((d) => d.id);
            const allDecks = await Promise.all(allDeckIds.map((did) => decks.fetchOne(did)));
            const cards = allDecks.flatMap((d) => (d ? d.cards : []));
            await srsApi.ensureProgress(
                id,
                cards.map((c) => ({ id: c.id, deckId: c.deckId })),
            );
            progress.value = await srsApi.listProgress(id);
            rebuildDueQueue(allDecks.filter((d): d is NonNullable<typeof d> => !!d));
        } finally {
            loading.value = false;
        }
    };

    const rebuildDueQueue = (
        decksWithCards: { id: string; title: string; cards: Card[] }[] = [],
    ) => {
        const map = new Map<string, { title: string; cards: Card[] }>();
        for (const d of decksWithCards) map.set(d.id, { title: d.title, cards: d.cards });

        const items: DueCard[] = [];
        for (const p of Object.values(progress.value)) {
            if (!isDue(p)) continue;
            const deck = map.get(p.deckId);
            if (!deck) continue;
            const card = deck.cards.find((c) => c.id === p.cardId);
            if (!card) continue;
            items.push({ card, progress: p, deckTitle: deck.title });
        }
        items.sort(
            (a, b) =>
                new Date(a.progress.nextReviewAt).getTime() -
                new Date(b.progress.nextReviewAt).getTime(),
        );
        dueCards.value = items;
    };

    const rate = async (cardId: string, deckId: string, rating: SrsRating) => {
        const id = requireUser();
        const updated = await srsApi.rateCard(id, cardId, deckId, rating);
        progress.value = { ...progress.value, [cardId]: updated };
        dueCards.value = dueCards.value.filter((d) => d.card.id !== cardId);
        return updated;
    };

    return {
        progress,
        dueCards,
        dueCount,
        nextReviewAt,
        loading,
        fetchAll,
        rate,
    };
});
