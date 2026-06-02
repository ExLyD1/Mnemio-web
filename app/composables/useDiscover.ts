import { swatchFor } from '@/utils/coverSwatches';
import type { DeckCardVM } from '@/types/deck';

export interface DiscoverCategory {
    name: string;
    count: number;
}

const deck = (
    id: string,
    title: string,
    tag: string,
    total: number,
    author: string,
    copies: number,
): DeckCardVM => ({
    id,
    title,
    tag,
    total,
    masteredPct: 0,
    due: 0,
    swatch: swatchFor(id),
    author,
    copies,
});

/** Mock community decks until public browsing exists on the backend (plan §3.6). */
export const useDiscover = () => {
    const featured: DeckCardVM[] = [
        deck('disc-jp-n5', 'JLPT N5 Essentials', 'Japanese', 670, 'mnemio', 12400),
        deck('disc-es-1k', 'Spanish 1000', 'Spanish', 1000, 'lucia', 9800),
        deck('disc-toefl', 'TOEFL Power Words', 'English', 520, 'priya', 7300),
    ];

    const decks: DeckCardVM[] = [
        deck('disc-fr-verbs', 'French Verbs', 'French', 300, 'amelie', 4200),
        deck('disc-de-a1', 'German A1', 'German', 480, 'jonas', 3900),
        deck('disc-jp-kanji', 'Joyo Kanji', 'Japanese', 2136, 'kenji', 6100),
        deck('disc-it-travel', 'Italian for Travel', 'Italian', 240, 'marco', 2800),
        deck('disc-ko-topik', 'TOPIK I Vocab', 'Korean', 800, 'soo', 3300),
        deck('disc-zh-hsk2', 'HSK 2', 'Mandarin', 300, 'wei', 5200),
        deck('disc-en-idioms', 'English Idioms', 'English', 360, 'sam', 4700),
        deck('disc-es-food', 'Spanish Food & Drink', 'Spanish', 180, 'lucia', 2100),
        deck('disc-pt-basics', 'Portuguese Basics', 'Portuguese', 420, 'ana', 1900),
    ];

    const categories: DiscoverCategory[] = [
        { name: 'Languages', count: 1240 },
        { name: 'Exam prep', count: 380 },
        { name: 'Science', count: 210 },
        { name: 'History', count: 160 },
        { name: 'Programming', count: 95 },
        { name: 'Arts', count: 70 },
    ];

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'Japanese', label: 'Japanese' },
        { key: 'Spanish', label: 'Spanish' },
        { key: 'English', label: 'English' },
        { key: 'French', label: 'French' },
        { key: 'German', label: 'German' },
        { key: 'Korean', label: 'Korean' },
        { key: 'Mandarin', label: 'Mandarin' },
    ];

    const sorts = [
        { key: 'popular', label: 'Most popular' },
        { key: 'newest', label: 'Newest' },
        { key: 'copied', label: 'Most copied' },
        { key: 'rated', label: 'Highest rated' },
    ];

    return { featured, decks, categories, filters, sorts };
};
