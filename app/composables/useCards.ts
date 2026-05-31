import { useDecksStore } from '@/stores/decks';
import { useAsync } from '@/composables/useAsync';

export const useCards = () => {
    const store = useDecksStore();

    return {
        store,
        addCard: useAsync(store.addCard),
        updateCard: useAsync(store.updateCard),
        deleteCard: useAsync(store.deleteCard),
    };
};
