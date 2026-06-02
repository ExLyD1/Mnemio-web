import { ref } from 'vue';
import * as discoverApi from '@/api/discover';
import type { DiscoverParams } from '@/api/discover';
import { deckToCardVm } from '@/utils/deckVm';
import type { DeckCardVM, DeckWithAuthor } from '@/types/deck';
import type { DiscoverCategory } from '@/types/discover';

const toVm = (d: DeckWithAuthor): DeckCardVM => ({
    ...deckToCardVm(d),
    author: d.author.username ?? d.author.fullName ?? 'someone',
    copies: d.copyCount,
});

export const useDiscover = () => {
    const featured = ref<DeckCardVM[]>([]);
    const decks = ref<DeckCardVM[]>([]);
    const categories = ref<DiscoverCategory[]>([]);
    const total = ref(0);
    const loading = ref(false);

    const filters = [
        { key: 'all', label: 'All' },
        { key: 'ja', label: 'Japanese' },
        { key: 'es', label: 'Spanish' },
        { key: 'en', label: 'English' },
        { key: 'fr', label: 'French' },
        { key: 'de', label: 'German' },
        { key: 'ko', label: 'Korean' },
        { key: 'zh', label: 'Mandarin' },
    ];
    const sorts = [
        { key: 'recent', label: 'Newest' },
        { key: 'popular', label: 'Most popular' },
    ];

    const load = async (opts: DiscoverParams = {}) => {
        loading.value = true;
        try {
            const [d, f, c] = await Promise.all([
                discoverApi.listDecks(opts),
                discoverApi.getFeatured(),
                discoverApi.getCategories(),
            ]);
            decks.value = d.items.map(toVm);
            total.value = d.total;
            featured.value = f.items.map(toVm);
            categories.value = c.items;
        } finally {
            loading.value = false;
        }
    };

    const copyDeck = (deckId: string) => discoverApi.copyDeck(deckId);

    return { featured, decks, categories, total, loading, filters, sorts, load, copyDeck };
};
