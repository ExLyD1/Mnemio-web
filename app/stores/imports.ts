import { defineStore, ref } from '#imports';
import { importApkg } from '@/api/imports';
import { useDecksStore } from '@/stores/decks';
import { useAchievementNotifications } from '@/composables/useAchievementNotifications';

export const useImportsStore = defineStore('imports', () => {
    const decks = useDecksStore();
    const notifications = useAchievementNotifications();
    const refreshFailed = ref(false);
    const importFile = async (file: File, sourceLanguage: string, targetLanguage: string) => {
        const result = await importApkg(file, sourceLanguage, targetLanguage);
        notifications.announce(result.newAchievements);
        refreshFailed.value = false;
        try {
            await decks.fetchList({ cursor: null, append: false });
        } catch {
            refreshFailed.value = true;
        }
        // An already-created import remains a success even if refreshing the library fails.
        return result;
    };
    return { importFile, refreshFailed };
});
