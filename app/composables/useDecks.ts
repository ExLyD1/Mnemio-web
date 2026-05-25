import { useDecksStore } from '@/stores/decks';
import { useAsync } from '@/composables/useAsync';

export const useDecks = () => {
    const store = useDecksStore();

    return {
        store,
        fetchList: useAsync(store.fetchList),
        fetchOne: useAsync(store.fetchOne),
        create: useAsync(store.create),
        update: useAsync(store.update),
        remove: useAsync(store.remove),
        setSearch: useAsync(store.setSearch),
        loadMore: useAsync(store.loadMore),
    };
};
