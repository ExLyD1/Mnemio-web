import { computed } from 'vue';
import { useSrsStore } from '@/stores/srs';
import { isDue } from '@/composables/useSpacedRepetition';

const MASTERED_REPETITIONS = 3;

export interface DeckStat {
    mastered: number;
    learning: number;
    due: number;
}

/** Per-deck mastery/due counts derived from the SRS progress map (plan §5.3). */
export const useDeckStats = () => {
    const srs = useSrsStore();

    const byDeck = computed<Record<string, DeckStat>>(() => {
        const map: Record<string, DeckStat> = {};
        for (const p of Object.values(srs.progress)) {
            const stat = (map[p.deckId] ??= { mastered: 0, learning: 0, due: 0 });
            if (p.repetitions >= MASTERED_REPETITIONS) {
                stat.mastered += 1;
            } else {
                stat.learning += 1;
            }
            if (isDue(p)) {
                stat.due += 1;
            }
        }
        return map;
    });

    const forDeck = (deckId: string, total: number) => {
        const stat = byDeck.value[deckId] ?? { mastered: 0, learning: 0, due: 0 };
        const masteredPct = total > 0 ? Math.round((stat.mastered / total) * 100) : 0;
        return { mastered: stat.mastered, learning: stat.learning, due: stat.due, masteredPct };
    };

    return { byDeck, forDeck };
};
