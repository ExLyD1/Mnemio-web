import type { User } from '@/types/user';

const uid = (): string =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const mockUser = (overrides: Partial<User> = {}): User => ({
    id: uid(),
    email: 'user@example.com',
    displayName: null,
    username: null,
    birthday: null,
    createdAt: new Date().toISOString(),
    ...overrides,
});

export const mockId = uid;
