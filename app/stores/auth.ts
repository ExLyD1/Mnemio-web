import { defineStore, ref, computed } from '#imports';
import {
    login as apiLogin,
    register as apiRegister,
    verifyEmail as apiVerifyEmail,
    resendOtp as apiResendOtp,
    logout as apiLogout,
    me as apiMe,
    updateProfile as apiUpdateProfile,
} from '@/api/auth';
import { readAccessToken, writeAccessToken } from '@/utils/authToken';
import type { User, ProfileDetails } from '@/types/user';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null);
    const accessToken = ref<string | null>(null);
    const pendingUserId = ref<string | null>(null);

    const isAuthenticated = computed(() => !!accessToken.value && !!user.value);
    const currentUser = computed(() => user.value);
    const needsProfile = computed(() => !!user.value && !user.value.username);

    const setSession = (u: User, token: string) => {
        user.value = u;
        accessToken.value = token;
        writeAccessToken(token);
        pendingUserId.value = null;
    };

    const clearSession = () => {
        user.value = null;
        accessToken.value = null;
        writeAccessToken(null);
    };

    const hydrate = async () => {
        const token = readAccessToken();
        if (!token) return;
        accessToken.value = token;
        try {
            const result = await apiMe();
            user.value = result.user;
        } catch {
            clearSession();
        }
    };

    const register = async (email: string, password: string) => {
        const result = await apiRegister(email, password);
        pendingUserId.value = result.userId;
        return result;
    };

    const verifyEmail = async (code: string) => {
        if (!pendingUserId.value) {
            throw { code: 'AUTH_NO_PENDING_USER', message: 'No registration in progress.' };
        }
        const result = await apiVerifyEmail(pendingUserId.value, code);
        setSession(result.user, result.accessToken);
        return result;
    };

    const resendOtp = async () => {
        if (!pendingUserId.value) {
            throw { code: 'AUTH_NO_PENDING_USER', message: 'No registration in progress.' };
        }
        return apiResendOtp(pendingUserId.value);
    };

    const login = async (email: string, password: string) => {
        const result = await apiLogin(email, password);
        setSession(result.user, result.accessToken);
        return result;
    };

    const logout = async () => {
        await apiLogout();
        clearSession();
    };

    const updateProfile = async (details: ProfileDetails) => {
        const result = await apiUpdateProfile(details);
        user.value = result.user;
        return result.user;
    };

    return {
        user,
        accessToken,
        pendingUserId,
        isAuthenticated,
        currentUser,
        needsProfile,
        hydrate,
        register,
        verifyEmail,
        resendOtp,
        login,
        logout,
        updateProfile,
    };
});
