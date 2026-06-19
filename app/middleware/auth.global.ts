import { useAuthStore } from '@/stores/auth';

const PUBLIC_ROUTES = new Set([
    '/',
    '/login',
    '/about',
    '/blog',
    '/privacy',
    '/terms',
    '/pricing',
    '/billing/success',
    '/billing/cancel',
    '/auth/oauth/callback',
    '/auth/oauth/error',
]);

// Public, crawler-facing learning content: the discover catalog, topic landing
// pages, and individual public-deck pages. Server-rendered and indexable, so no
// auth gate. (The private `/decks/**` owner app is unaffected.)
const PUBLIC_PREFIXES = ['/discover'];

const isPublic = (path: string): boolean =>
    PUBLIC_ROUTES.has(path) || PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

export default defineNuxtRouteMiddleware((to) => {
    if (import.meta.server) {
        return;
    }

    const auth = useAuthStore();

    if (isPublic(to.path)) {
        if (auth.isAuthenticated && to.path === '/login') {
            return navigateTo('/dashboard');
        }
        return;
    }

    if (!auth.isAuthenticated) {
        return navigateTo('/login');
    }
});
