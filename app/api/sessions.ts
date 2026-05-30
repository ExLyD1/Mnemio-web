import { mockStore } from '@/services/mockStore';
import { mockSession } from '@/services/mock';
import type { StudyMode, StudySession, SessionsState } from '@/types/session';
import type { ApiError } from '@/composables/useAsync';

const key = (userId: string) => mockStore.userKey(userId, 'sessions');

const err = (code: string, message: string): ApiError => ({ code, message });

const empty = (): SessionsState => ({ active: null, incomplete: [], history: [] });

const load = (userId: string): SessionsState =>
    mockStore.get<SessionsState>(key(userId)) ?? empty();
const save = (userId: string, state: SessionsState) => mockStore.set(key(userId), state);

export const listIncomplete = async (userId: string): Promise<StudySession[]> => {
    return load(userId).incomplete;
};

export const getActive = async (userId: string): Promise<StudySession | null> => {
    return load(userId).active;
};

export const startSession = async (
    userId: string,
    input: { deckId: string; mode: StudyMode; cardIds: string[] },
): Promise<StudySession> => {
    if (input.cardIds.length === 0) {
        throw err('SESSION_EMPTY_DECK', 'This deck has no cards to study.');
    }
    const state = load(userId);
    if (state.active) {
        const ended: StudySession = {
            ...state.active,
            status: 'incomplete',
            endedAt: new Date().toISOString(),
        };
        state.incomplete = [ended, ...state.incomplete].slice(0, 10);
    }
    const session = mockSession({
        userId,
        deckId: input.deckId,
        mode: input.mode,
        cardIds: input.cardIds,
        status: 'active',
    });
    state.active = session;
    save(userId, state);
    return session;
};

export const updateActive = async (
    userId: string,
    patch: Partial<Pick<StudySession, 'index' | 'correct'>>,
): Promise<StudySession> => {
    const state = load(userId);
    if (!state.active) throw err('SESSION_NOT_FOUND', 'No active session.');
    state.active = { ...state.active, ...patch };
    save(userId, state);
    return state.active;
};

export const completeSession = async (
    userId: string,
    xpAwarded: number,
): Promise<StudySession> => {
    const state = load(userId);
    if (!state.active) throw err('SESSION_NOT_FOUND', 'No active session.');
    const ended: StudySession = {
        ...state.active,
        status: 'complete',
        xpAwarded,
        endedAt: new Date().toISOString(),
    };
    state.active = null;
    state.history = [ended, ...state.history].slice(0, 50);
    save(userId, state);
    return ended;
};

export const exitActive = async (userId: string): Promise<void> => {
    const state = load(userId);
    if (!state.active) return;
    const ended: StudySession = {
        ...state.active,
        status: 'incomplete',
        endedAt: new Date().toISOString(),
    };
    state.incomplete = [ended, ...state.incomplete].slice(0, 10);
    state.active = null;
    save(userId, state);
};

export const resumeIncomplete = async (
    userId: string,
    sessionId: string,
): Promise<StudySession> => {
    const state = load(userId);
    const found = state.incomplete.find((s) => s.id === sessionId);
    if (!found) throw err('SESSION_NOT_FOUND', 'Session not found.');
    if (state.active) {
        const ended: StudySession = {
            ...state.active,
            status: 'incomplete',
            endedAt: new Date().toISOString(),
        };
        state.incomplete = [ended, ...state.incomplete.filter((s) => s.id !== sessionId)].slice(
            0,
            10,
        );
    } else {
        state.incomplete = state.incomplete.filter((s) => s.id !== sessionId);
    }
    const resumed: StudySession = { ...found, status: 'active', endedAt: null };
    state.active = resumed;
    save(userId, state);
    return resumed;
};
