import { useLibraryStore } from '@/stores/library';
import { useAsync } from '@/composables/useAsync';

export const useLibrary = () => {
    const store = useLibraryStore();

    return {
        store,
        fetch: useAsync(store.fetch),
        loadMore: useAsync(store.loadMore),
        fetchAll: useAsync(store.fetchAll),
    };
};
