import { useAuthStore } from '@/stores/auth';
import { useAsync } from '@/composables/useAsync';

export const useAuth = () => {
    const store = useAuthStore();

    return {
        store,
        login: useAsync(store.login),
        register: useAsync(store.register),
        verifyEmail: useAsync(store.verifyEmail),
        resendOtp: useAsync(store.resendOtp),
        logout: useAsync(store.logout),
        updateProfile: useAsync(store.updateProfile),
    };
};
