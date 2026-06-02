export type StudyMode = 'flashcard' | 'multiple-choice' | 'srs';

export type SessionStatus = 'active' | 'incomplete' | 'complete';

export interface SessionCounts {
    again: number;
    hard: number;
    good: number;
    easy: number;
}

export interface StudySession {
    id: string;
    userId: string;
    deckId: string;
    mode: StudyMode;
    cardIds: string[];
    index: number;
    correct: number;
    xpAwarded: number;
    status: SessionStatus;
    counts: SessionCounts;
    revisitCardIds: string[];
    durationMs: number;
    startedAt: string;
    endedAt: string | null;
}

export interface SessionsState {
    active: StudySession | null;
    incomplete: StudySession[];
    history: StudySession[];
}
