import { defineStore, ref } from '#imports';
import { importApkg } from '@/api/imports';
import { useDecksStore } from '@/stores/decks';
import { useLibraryStore } from '@/stores/library';
import { useAchievementNotifications } from '@/composables/useAchievementNotifications';
import type { Subject } from '@/utils/subjects';

export const useImportsStore = defineStore('imports', () => {
    const decks = useDecksStore();
    const library = useLibraryStore();
    const notifications = useAchievementNotifications();
    const refreshFailed = ref(false);
    const importFile = async (
        file: File,
        sourceLanguage: string,
        targetLanguage: string,
        subject?: Subject,
    ) => {
        const result = await importApkg(file, sourceLanguage, targetLanguage, subject);
        notifications.announce(result.newAchievements);
        library.invalidate();
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
