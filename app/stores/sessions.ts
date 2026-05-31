import { defineStore, ref, computed } from '#imports';
import * as sessionsApi from '@/api/sessions';
import { useAuthStore } from '@/stores/auth';
import type { StudyMode, StudySession } from '@/types/session';

export const useSessionsStore = defineStore('sessions', () => {
    const active = ref<StudySession | null>(null);
    const incomplete = ref<StudySession[]>([]);
    const lastCompleted = ref<StudySession | null>(null);

    const auth = useAuthStore();
    const userId = computed(() => auth.currentUser?.id ?? null);

    const requireUser = (): string => {
        const id = userId.value;
        if (!id) throw { code: 'AUTH_NOT_AUTHENTICATED', message: 'Not signed in.' };
        return id;
    };

    const latestIncomplete = computed(() => incomplete.value[0] ?? null);

    const hydrate = async () => {
        const id = userId.value;
        if (!id) return;
        active.value = await sessionsApi.getActive(id);
        incomplete.value = await sessionsApi.listIncomplete(id);
    };

    const start = async (input: { deckId: string; mode: StudyMode; cardIds: string[] }) => {
        const id = requireUser();
        const replacedActive = active.value;
        const session = await sessionsApi.startSession(id, input);
        active.value = session;
        if (replacedActive) {
            incomplete.value = await sessionsApi.listIncomplete(id);
        }
        return session;
    };

    const updateActive = async (patch: Partial<Pick<StudySession, 'index' | 'correct'>>) => {
        const id = requireUser();
        const updated = await sessionsApi.updateActive(id, patch);
        active.value = updated;
        return updated;
    };

    const complete = async (xpAwarded: number) => {
        const id = requireUser();
        const ended = await sessionsApi.completeSession(id, xpAwarded);
        active.value = null;
        lastCompleted.value = ended;
        return ended;
    };

    const exit = async () => {
        const id = requireUser();
        await sessionsApi.exitActive(id);
        active.value = null;
        incomplete.value = await sessionsApi.listIncomplete(id);
    };

    const resume = async (sessionId: string) => {
        const id = requireUser();
        const resumed = await sessionsApi.resumeIncomplete(id, sessionId);
        active.value = resumed;
        incomplete.value = await sessionsApi.listIncomplete(id);
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
