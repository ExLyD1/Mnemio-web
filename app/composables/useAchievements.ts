import { ref } from 'vue';
import * as achievementsApi from '@/api/achievements';
import type { Achievement } from '@/types/achievement';

/**
 * Read-only achievement list for the profile/statistics grids. Toasting new
 * unlocks is handled elsewhere (`useAchievementNotifications`, fed directly by
 * the rate/session-complete/card-create responses) — this composable no longer
 * decides what's "new", it just fetches the full catalog + earned state.
 */
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
