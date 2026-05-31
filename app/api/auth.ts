import { http } from '@/utils/http';
import { writeAccessToken } from '@/utils/authToken';
import type { User, ProfileDetails } from '@/types/user';

/**
 * Backend wire types (per docs/api-contract.md).
 * Backend User has more fields than the FE consumes; we adapt to the FE shape.
 */
interface BackendUser {
    id: string;
    email: string;
    fullName: string | null;
    username: string | null;
    birthday: string | null;
    avatarUrl?: string | null;
    emailVerified?: boolean;
    role?: 'user' | 'admin';
    xp?: number;
    streak?: number;
    createdAt: string;
    updatedAt?: string;
}

interface AuthTokenResponse {
    accessToken: string;
    user: BackendUser;
    needsProfile: boolean;
}

interface RegisterResponse {
    userId: string;
    email: string;
}

interface ResendOtpResponse {
    ok: true;
    cooldownSeconds: number;
}

interface UpdateProfileResponse {
    user: BackendUser;
    needsProfile: boolean;
}

const toUser = (u: BackendUser): User => ({
    id: u.id,
    email: u.email,
    displayName: u.fullName,
    username: u.username,
    birthday: u.birthday,
    createdAt: u.createdAt,
});

// ─── Endpoints ──────────────────────────────────────────────────────────────

export interface RegisterResult {
    userId: string;
    email: string;
}

export const register = async (email: string, password: string): Promise<RegisterResult> => {
    const res = await http<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: { email, password },
        skipAuth: true,
    });
    return { userId: res.userId, email: res.email };
};

export interface VerifyEmailResult {
    user: User;
    accessToken: string;
    needsProfile: boolean;
}

export const verifyEmail = async (userId: string, code: string): Promise<VerifyEmailResult> => {
    const res = await http<AuthTokenResponse>('/auth/verify-email', {
        method: 'POST',
        body: { userId, code },
        skipAuth: true,
    });
    writeAccessToken(res.accessToken);
    return {
        user: toUser(res.user),
        accessToken: res.accessToken,
        needsProfile: res.needsProfile,
    };
};

export const resendOtp = async (userId: string): Promise<ResendOtpResponse> => {
    return http<ResendOtpResponse>('/auth/resend-otp', {
        method: 'POST',
        body: { userId },
        skipAuth: true,
    });
};

export interface LoginResult extends VerifyEmailResult {}

export const login = async (email: string, password: string): Promise<LoginResult> => {
    const res = await http<AuthTokenResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        skipAuth: true,
    });
    writeAccessToken(res.accessToken);
    return {
        user: toUser(res.user),
        accessToken: res.accessToken,
        needsProfile: res.needsProfile,
    };
};

export const logout = async (): Promise<void> => {
    try {
        await http<void>('/auth/logout', { method: 'POST', skipRefresh: true });
    } catch {
        // Always succeed locally; backend will clear cookie if reachable.
    } finally {
        writeAccessToken(null);
    }
};

export interface MeResult {
    user: User;
    needsProfile: boolean;
}

export const me = async (): Promise<MeResult> => {
    const res = await http<{ user: BackendUser; needsProfile: boolean }>('/auth/me');
    return { user: toUser(res.user), needsProfile: res.needsProfile };
};

export const updateProfile = async (details: ProfileDetails): Promise<MeResult> => {
    const res = await http<UpdateProfileResponse>('/users/me', {
        method: 'PATCH',
        body: {
            fullName: details.fullName,
            username: details.username,
            birthday: details.birthday,
        },
    });
    return { user: toUser(res.user), needsProfile: res.needsProfile };
};
