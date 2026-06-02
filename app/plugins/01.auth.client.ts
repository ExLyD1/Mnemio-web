import { useAuthStore } from '@/stores/auth';
import { usePreferencesStore } from '@/stores/preferences';

export default defineNuxtPlugin(async () => {
    const auth = useAuthStore();
    await auth.hydrate();
    if (auth.isAuthenticated) {
        const prefs = usePreferencesStore();
        await prefs.hydrate().catch(() => {
            // preferences are non-critical for boot; ignore failures
        });
    }
});
