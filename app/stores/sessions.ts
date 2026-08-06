import { defineStore, ref, computed } from '#imports';
import * as sessionsApi from '@/api/sessions';
import type { SessionPatch } from '@/api/sessions';
import { useAchievementNotifications } from '@/composables/useAchievementNotifications';
import type { StudyMode, StudySession } from '@/types/session';

export const useSessionsStore = defineStore('sessions', () => {
    const active = ref<StudySession | null>(null);
    const incomplete = ref<StudySession[]>([]);
    const lastCompleted = ref<StudySession | null>(null);
    // Grabbed once at store setup (valid Vue/i18n context) and reused inside
    // `complete()` after its await — see useAchievementNotifications.ts.
    const notifications = useAchievementNotifications();

    const latestIncomplete = computed(() => incomplete.value[0] ?? null);

    const hydrate = async () => {
        active.value = await sessionsApi.getActive();
        incomplete.value = await sessionsApi.listIncomplete();
    };

    const start = async (input: { deckId: string; mode: StudyMode; cardIds?: string[] }) => {
        const replaced = active.value;
        const session = await sessionsApi.startSession({ deckId: input.deckId, mode: input.mode });
        active.value = session;
        if (replaced) {
            incomplete.value = await sessionsApi.listIncomplete();
        }
        return session;
    };

    const updateActive = async (patch: SessionPatch) => {
        if (!active.value) {
            return null;
        }
        const updated = await sessionsApi.updateActive(active.value.id, patch);
        active.value = updated;
        return updated;
    };

    const complete = async (_xpAwarded?: number) => {
        if (!active.value) {
            return null;
        }
        const { session: ended, newAchievements } = await sessionsApi.completeSession(
            active.value.id,
        );
        active.value = null;
        lastCompleted.value = ended;
        notifications.announce(newAchievements);
        return ended;
    };

    const exit = async () => {
        if (!active.value) {
            return;
        }
        await sessionsApi.exitActive(active.value.id);
        active.value = null;
        incomplete.value = await sessionsApi.listIncomplete();
    };

    const resume = async (sessionId: string) => {
        const resumed = await sessionsApi.resumeIncomplete(sessionId);
        active.value = resumed;
        incomplete.value = await sessionsApi.listIncomplete();
        return resumed;
    };

    return {
        active,
        incomplete,
        lastCompleted,
        latestIncomplete,
        hydrate,
        start,
        updateActive,
        complete,
        exit,
        resume,
    };
});
