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
        // Achievement catch-up (fetchUnseen) is NOT done here: it needs
        // useT()/useI18n(), which requires a real component `setup()` context
        // — a Nuxt plugin doesn't have one (see 02.schema.ts's note on the
        // same constraint). Done instead in Topbar.vue's onMounted, which is
        // only ever rendered for authenticated users anyway.
    }
});
