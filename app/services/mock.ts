import type { User } from '@/types/user';
import type { Card, Deck } from '@/types/deck';
import type { StudyMode, StudySession } from '@/types/session';
import type { CardProgress } from '@/types/srs';

const uid = (): string =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);

const now = () => new Date().toISOString();

export const mockUser = (overrides: Partial<User> = {}): User => ({
    id: uid(),
    email: 'user@example.com',
    displayName: null,
    username: null,
    birthday: null,
    createdAt: now(),
    ...overrides,
});

export const mockDeck = (overrides: Partial<Deck> = {}): Deck => ({
    id: uid(),
    ownerId: overrides.ownerId ?? uid(),
    title: 'Untitled deck',
    description: null,
    sourceLanguage: 'en',
    targetLanguage: 'es',
    isPublic: false,
    cards: [],
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
});

export const mockCard = (overrides: Partial<Card> = {}): Card => ({
    id: uid(),
    deckId: overrides.deckId ?? uid(),
    word: 'word',
    definition: 'definition',
    phonetic: null,
    position: overrides.position ?? 0,
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
});

export const mockSession = (overrides: Partial<StudySession> = {}): StudySession => ({
    id: uid(),
    userId: overrides.userId ?? uid(),
    deckId: overrides.deckId ?? uid(),
    mode: (overrides.mode ?? 'flashcard') as StudyMode,
    cardIds: [],
    index: 0,
    correct: 0,
    xpAwarded: 0,
    status: 'active',
    startedAt: now(),
    endedAt: null,
    ...overrides,
});

export const mockCardProgress = (
    cardId: string,
    deckId: string,
    overrides: Partial<CardProgress> = {},
): CardProgress => ({
    cardId,
    deckId,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    nextReviewAt: now(),
    lastReviewedAt: null,
    ...overrides,
});

export const mockId = uid;
