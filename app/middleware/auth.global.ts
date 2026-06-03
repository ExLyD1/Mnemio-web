import { useAuthStore } from '@/stores/auth';

const PUBLIC_ROUTES = new Set(['/', '/login', '/about', '/blog', '/privacy', '/terms']);

export default defineNuxtRouteMiddleware((to) => {
    if (import.meta.server) {
        return;
    }

    const auth = useAuthStore();

    if (PUBLIC_ROUTES.has(to.path)) {
        if (auth.isAuthenticated && to.path === '/login') {
            return navigateTo('/dashboard');
        }
        return;
    }

    if (!auth.isAuthenticated) {
        return navigateTo('/login');
    }
});
