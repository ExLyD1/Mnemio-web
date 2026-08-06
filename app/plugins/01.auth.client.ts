import { useAuthStore } from '@/stores/auth';
import { usePreferencesStore } from '@/stores/preferences';
import { useAchievementNotifications } from '@/composables/useAchievementNotifications';

export default defineNuxtPlugin(async () => {
    const auth = useAuthStore();
    // Grabbed synchronously (valid Nuxt-plugin context) before the awaits below.
    const notifications = useAchievementNotifications();
    await auth.hydrate();
    if (auth.isAuthenticated) {
        const prefs = usePreferencesStore();
        await prefs.hydrate().catch(() => {
            // preferences are non-critical for boot; ignore failures
        });
        // Catch-up toast/bell for anything unlocked on another device/tab
        // since this device last acked. Non-critical — errors are swallowed
        // inside fetchUnseen().
        void notifications.fetchUnseen();
    }
});
