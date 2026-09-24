import { defineStore, ref, computed } from '#imports';
import {
    login as apiLogin,
    register as apiRegister,
    verifyEmail as apiVerifyEmail,
    resendOtp as apiResendOtp,
    logout as apiLogout,
    me as apiMe,
    updateProfile as apiUpdateProfile,
    oauthExchange as apiOauthExchange,
} from '@/api/auth';
import { canRestoreFromCookie, readAccessToken, writeAccessToken } from '@/utils/authToken';
import { refreshAccessToken } from '@/utils/http';
import { useAnalytics } from '@/composables/useAnalytics';
import { usePreferencesStore } from '@/stores/preferences';
import type { User, ProfileUpdate } from '@/types/user';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null);
    const accessToken = ref<string | null>(null);
    const pendingUserId = ref<string | null>(null);
    const plan = ref<'free' | 'premium'>('free');

    const isAuthenticated = computed(() => !!accessToken.value && !!user.value);
    const currentUser = computed(() => user.value);
    // Must match the server's rule (backend shared/mappers.ts needsProfile):
    // username OR fullName missing. This used to check username only, so a user
    // with a username but no full name was sent past onboarding while every
    // auth response said they still needed it.
    const needsProfile = computed(
        () => !!user.value && (!user.value.username || !user.value.fullName),
    );
    const isPremium = computed(() => plan.value === 'premium');

    const setSession = (u: User, token: string, p: 'free' | 'premium' = 'free') => {
        user.value = u;
        accessToken.value = token;
        writeAccessToken(token);
        pendingUserId.value = null;
        plan.value = p;

        // Identity stitching: merge the anon $device_id history into this user so
        // pre-signup events (homepage, discover, blog) connect to the account.
        const analytics = useAnalytics();
        analytics.identify(u.id);
        analytics.registerSuper({ plan: p });
        analytics.setUserProps({ plan: p });

        // Refresh preferences for THIS user right away. Without this, switching
        // accounts in-app (logout -> login as someone else, no full page reload)
        // would leave the previous user's native/learning languages etc. sitting
        // in the preferences store, still marked `loaded`, and get displayed as
        // if they were this user's real settings.
        usePreferencesStore()
            .hydrate()
            .catch(() => {});
    };

    const clearSession = () => {
        user.value = null;
        accessToken.value = null;
        writeAccessToken(null);
        plan.value = 'free';
        useAnalytics().reset();
        usePreferencesStore().reset();
    };

    const hydrate = async () => {
        let token = readAccessToken();
        if (!token) {
            // The access token lives in script storage, which mobile browsers
            // may clear (e.g. Safari after 7 days without a visit) while the
            // 30-day HttpOnly refresh cookie is still valid. Previously that
            // meant "logged out on reopen" (QA (3) #10) even though the session
            // was fine. Try to restore it from the cookie first. For visitors
            // with no session this is one 401 on boot and nothing else.
            if (!canRestoreFromCookie()) {
                return;
            }
            const restored = await refreshAccessToken();
            if (!restored.token) {
                return;
            }
            token = restored.token;
        }
        accessToken.value = token;
        try {
            // A 401 here is auto-recovered by http.ts: it refreshes via the cookie and
            // retries, so an expired access token alone does not end the session.
            const result = await apiMe();
            user.value = result.user;
            plan.value = result.plan;
            accessToken.value = readAccessToken();
        } catch (e) {
            // Only a revoked/stolen refresh token is a real logout. Network errors or a
            // backend that is still booting must NOT wipe a valid session — keep the
            // token so the next boot can recover.
            if ((e as { code?: string }).code === 'AUTH_INVALID_REFRESH') {
                clearSession();
            }
        }
    };

    const register = async (email: string, password: string) => {
        const result = await apiRegister(email, password);
        pendingUserId.value = result.userId;
        return result;
    };

    const verifyEmail = async (code: string) => {
        if (!pendingUserId.value) {
            throw Object.assign(new Error('No registration in progress.'), {
                code: 'AUTH_NO_PENDING_USER',
            });
        }
        const result = await apiVerifyEmail(pendingUserId.value, code);
        setSession(result.user, result.accessToken, result.plan);
        return result;
    };

    const resendOtp = async () => {
        if (!pendingUserId.value) {
            throw Object.assign(new Error('No registration in progress.'), {
                code: 'AUTH_NO_PENDING_USER',
            });
        }
        return apiResendOtp(pendingUserId.value);
    };

    const login = async (email: string, password: string) => {
        const result = await apiLogin(email, password);
        setSession(result.user, result.accessToken, result.plan);
        return result;
    };

    const oauthExchange = async (code: string) => {
        const result = await apiOauthExchange(code);
        setSession(result.user, result.accessToken, result.plan);
        return result;
    };

    const logout = async () => {
        await apiLogout();
        clearSession();
    };

    const updateProfile = async (details: ProfileUpdate) => {
        const result = await apiUpdateProfile(details);
        user.value = result.user;
        return result.user;
    };

    return {
        user,
        accessToken,
        pendingUserId,
        plan,
        isAuthenticated,
        currentUser,
        needsProfile,
        isPremium,
        hydrate,
        register,
        verifyEmail,
        resendOtp,
        login,
        logout,
        updateProfile,
        oauthExchange,
    };
});
