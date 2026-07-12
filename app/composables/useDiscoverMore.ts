import { ref } from '#imports';
import type { DeckCardVM, DeckWithAuthor } from '@/types/deck';
import { deckToCardVm } from '@/utils/deckVm';

export const discoverToVm = (d: DeckWithAuthor): DeckCardVM => ({
    ...deckToCardVm(d),
    author: d.author.username ?? d.author.fullName ?? 'someone',
    copies: d.copyCount,
});

export const useDiscoverMore = () => {
    const extra = ref<DeckCardVM[]>([]);
    const cursor = ref<string | null>(null);
    const loading = ref(false);

    const init = (nextCursor: string | null) => {
        extra.value = [];
        cursor.value = nextCursor;
    };

    const loadMore = async (
        fetcher: () => Promise<{ items: DeckWithAuthor[]; nextCursor: string | null }>,
    ) => {
        if (!cursor.value || loading.value) {
            return;
        }
        loading.value = true;
        try {
            const res = await fetcher();
            extra.value = [...extra.value, ...res.items.map(discoverToVm)];
            cursor.value = res.nextCursor;
        } finally {
            loading.value = false;
        }
    };

    return { extra, cursor, loading, init, loadMore };
};
