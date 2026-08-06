import { http } from '@/utils/http';
import type { SessionCounts, StudyMode, StudySession } from '@/types/session';
import type { Achievement } from '@/types/achievement';

type WireMode = 'flashcard' | 'multiple_choice' | 'srs';

interface WireSession {
    id: string;
    userId: string;
    deckId: string;
    mode: WireMode;
    status: 'active' | 'incomplete' | 'complete';
    cardIds: string[];
    cardIndex: number;
    correct: number;
    xpAwarded: number;
    counts: SessionCounts;
    revisitCardIds: string[];
    durationMs: number;
    startedAt: string;
    endedAt: string | null;
}

// POST /sessions/:id/complete additionally reports achievements unlocked by
// finishing this session — see docs/api-contract.md.
interface WireCompleteResult extends WireSession {
    newAchievements: Achievement[];
}

const toFeMode = (m: WireMode): StudyMode => (m === 'multiple_choice' ? 'multiple-choice' : m);
const toWireMode = (m: StudyMode): WireMode => (m === 'multiple-choice' ? 'multiple_choice' : m);

const toSession = (s: WireSession): StudySession => ({
    id: s.id,
    userId: s.userId,
    deckId: s.deckId,
    mode: toFeMode(s.mode),
    cardIds: s.cardIds,
    index: s.cardIndex,
    correct: s.correct,
    xpAwarded: s.xpAwarded,
    status: s.status,
    counts: s.counts,
    revisitCardIds: s.revisitCardIds,
    durationMs: s.durationMs,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
});

const clean = (input: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));

export const getActive = async (): Promise<StudySession | null> => {
    const res = await http<{ session: WireSession | null }>('/sessions/active');
    return res.session ? toSession(res.session) : null;
};

export const listIncomplete = async (): Promise<StudySession[]> => {
    const res = await http<{ session: WireSession | null }>('/sessions/incomplete');
    return res.session ? [toSession(res.session)] : [];
};

export const startSession = async (input: {
    deckId: string;
    mode: StudyMode;
}): Promise<StudySession> => {
    const s = await http<WireSession>('/sessions', {
        method: 'POST',
        body: { deckId: input.deckId, mode: toWireMode(input.mode) },
    });
    return toSession(s);
};

export interface SessionPatch {
    index?: number;
    correct?: number;
    counts?: SessionCounts;
    revisitCardIds?: string[];
    durationMs?: number;
}

export const updateActive = async (
    sessionId: string,
    patch: SessionPatch,
): Promise<StudySession> => {
    const body = clean({
        cardIndex: patch.index,
        correct: patch.correct,
        counts: patch.counts,
        revisitCardIds: patch.revisitCardIds,
        durationMs: patch.durationMs,
    });
    const s = await http<WireSession>(`/sessions/${sessionId}`, { method: 'PATCH', body });
    return toSession(s);
};

export const completeSession = async (
    sessionId: string,
): Promise<{ session: StudySession; newAchievements: Achievement[] }> => {
    const s = await http<WireCompleteResult>(`/sessions/${sessionId}/complete`, {
        method: 'POST',
    });
    return { session: toSession(s), newAchievements: s.newAchievements };
};

export const exitActive = async (sessionId: string): Promise<StudySession> => {
    const s = await http<WireSession>(`/sessions/${sessionId}/exit`, { method: 'POST' });
    return toSession(s);
};

export const resumeIncomplete = async (sessionId: string): Promise<StudySession> => {
    const s = await http<WireSession>(`/sessions/${sessionId}/resume`, { method: 'POST' });
    return toSession(s);
};
