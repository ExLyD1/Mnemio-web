import { useAuthStore } from '@/stores/auth';
import { useAsync } from '@/composables/useAsync';

export const useAuth = () => {
    const store = useAuthStore();

    const loginAsync = useAsync(store.login);
    const registerAsync = useAsync(store.register);
    const logoutAsync = useAsync(store.logout);
    const updateProfileAsync = useAsync(store.updateProfile);

    return {
        store,
        login: loginAsync,
        register: registerAsync,
        logout: logoutAsync,
        updateProfile: updateProfileAsync,
    };
};
