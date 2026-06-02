import { ref } from 'vue';
import * as achievementsApi from '@/api/achievements';
import type { Achievement } from '@/types/achievement';

export const useAchievements = () => {
    const items = ref<Achievement[]>([]);
    const loading = ref(false);

    const load = async () => {
        loading.value = true;
        try {
            const res = await achievementsApi.listAchievements();
            items.value = res.items;
        } finally {
            loading.value = false;
        }
    };

    return { items, loading, load };
};
