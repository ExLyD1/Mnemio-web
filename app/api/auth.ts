import { mockStore } from '@/services/mockStore';
import { mockUser } from '@/services/mock';
import type { User, ProfileDetails } from '@/types/user';
import type { ApiError } from '@/composables/useAsync';

const USERS_KEY = 'auth:users';
const TOKEN_PREFIX = 'mock_token_';

interface StoredUser extends User {
    password: string;
}

const err = (code: string, message: string): ApiError => ({ code, message });

const loadUsers = (): StoredUser[] => mockStore.get<StoredUser[]>(USERS_KEY) ?? [];
const saveUsers = (users: StoredUser[]) => mockStore.set(USERS_KEY, users);

const issueToken = (userId: string) => TOKEN_PREFIX + userId;

const stripPassword = ({ password: _p, ...u }: StoredUser): User => u;

export interface AuthResult {
    user: User;
    accessToken: string;
}

export const register = async (email: string, password: string): Promise<AuthResult> => {
    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw err('AUTH_EMAIL_TAKEN', 'An account with this email already exists.');
    }
    const user: StoredUser = { ...mockUser({ email }), password };
    users.push(user);
    saveUsers(users);
    return { user: stripPassword(user), accessToken: issueToken(user.id) };
};

export const login = async (email: string, password: string): Promise<AuthResult> => {
    const users = loadUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found || found.password !== password) {
        throw err('AUTH_INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }
    return { user: stripPassword(found), accessToken: issueToken(found.id) };
};

export const logout = async (): Promise<void> => {
    return;
};

export const updateProfile = async (
    userId: string,
    details: ProfileDetails,
): Promise<User> => {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw err('AUTH_USER_NOT_FOUND', 'User not found.');

    const taken = users.some(
        (u) =>
            u.id !== userId &&
            u.username !== null &&
            u.username.toLowerCase() === details.username.toLowerCase(),
    );
    if (taken) throw err('AUTH_USERNAME_TAKEN', 'This username is already taken.');

    users[idx] = {
        ...users[idx]!,
        displayName: details.fullName,
        username: details.username,
        birthday: details.birthday,
    };
    saveUsers(users);
    return stripPassword(users[idx]!);
};
