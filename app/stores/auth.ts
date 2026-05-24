import { defineStore, ref, computed } from '#imports';
import {
    login as apiLogin,
    register as apiRegister,
    logout as apiLogout,
    updateProfile as apiUpdateProfile,
} from '@/api/auth';
import { mockStore } from '@/services/mockStore';
import type { User, ProfileDetails } from '@/types/user';

const USER_KEY = 'auth:user';
const TOKEN_KEY = 'auth:accessToken';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null);
    const accessToken = ref<string | null>(null);

    const isAuthenticated = computed(() => !!accessToken.value && !!user.value);
    const currentUser = computed(() => user.value);

    const persist = () => {
        if (user.value) mockStore.set(USER_KEY, user.value);
        else mockStore.remove(USER_KEY);
        if (accessToken.value) mockStore.set(TOKEN_KEY, accessToken.value);
        else mockStore.remove(TOKEN_KEY);
    };

    const hydrate = () => {
        user.value = mockStore.get<User>(USER_KEY);
        accessToken.value = mockStore.get<string>(TOKEN_KEY);
    };

    const login = async (email: string, password: string) => {
        const result = await apiLogin(email, password);
        user.value = result.user;
        accessToken.value = result.accessToken;
        persist();
        return result;
    };

    const register = async (email: string, password: string) => {
        const result = await apiRegister(email, password);
        user.value = result.user;
        accessToken.value = result.accessToken;
        persist();
        return result;
    };

    const logout = async () => {
        await apiLogout();
        user.value = null;
        accessToken.value = null;
        persist();
    };

    const updateProfile = async (details: ProfileDetails) => {
        if (!user.value) throw { code: 'AUTH_NOT_AUTHENTICATED', message: 'Not signed in.' };
        const updated = await apiUpdateProfile(user.value.id, details);
        user.value = updated;
        persist();
        return updated;
    };

    const needsProfile = computed(() => !!user.value && !user.value.username);

    return {
        user,
        accessToken,
        isAuthenticated,
        currentUser,
        needsProfile,
        login,
        register,
        logout,
        updateProfile,
        hydrate,
    };
});
