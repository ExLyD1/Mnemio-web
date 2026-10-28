import { storeToRefs } from 'pinia';
import { useAppearanceStore } from '@/stores/appearance';
import { useAsync } from '@/composables/useAsync';

export const useAppearance = () => {
    const store = useAppearanceStore();
    return {
        ...storeToRefs(store),
        setMascot: useAsync(store.setMascot),
        setPalette: useAsync(store.setPalette),
    };
};
