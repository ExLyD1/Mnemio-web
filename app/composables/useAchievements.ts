import { ref } from 'vue';
import * as achievementsApi from '@/api/achievements';
import { useToast } from '@/composables/useToast';
import { useT } from '@/composables/useT';
import type { Achievement } from '@/types/achievement';

const NOTIFIED_KEY = 'mnemio_ach_notified';

const getNotified = (): Set<string> => {
    if (!import.meta.client) {
        return new Set();
    }
    try {
        const raw = sessionStorage.getItem(NOTIFIED_KEY);
        return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
        return new Set();
    }
};

const markNotified = (ids: string[]): void => {
    if (!import.meta.client) {
        return;
    }
    try {
        const existing = getNotified();
        ids.forEach((id) => existing.add(id));
        sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify([...existing]));
    } catch {}
};

export const useAchievements = () => {
    const items = ref<Achievement[]>([]);
    const loading = ref(false);
    const toast = useToast();
    const { t } = useT();

    const load = async () => {
        loading.value = true;
        try {
            const res = await achievementsApi.listAchievements();
            const notified = getNotified();
            const newlyEarned = res.items.filter((a) => a.earned && !notified.has(a.id));
            items.value = res.items;
            if (newlyEarned.length > 0) {
                markNotified(newlyEarned.map((a) => a.id));
                for (const a of newlyEarned) {
                    toast.success(t('achievements.unlocked').replace('{name}', a.name));
                }
            }
        } finally {
            loading.value = false;
        }
    };

    return { items, loading, load };
};
