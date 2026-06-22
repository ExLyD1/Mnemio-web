import { useAuthStore } from '@/stores/auth';

// Routes that require a logged-in user. Everything NOT matched here is public and
// open to anyone (landing, blog, discover, about, pricing, legal, OAuth + billing
// callbacks) — so crawlers and logged-out visitors can read all content.
const APP_PREFIXES = [
    '/dashboard',
    '/decks',
    '/study',
    '/review',
    '/statistics',
    '/profile',
    '/onboarding',
    '/ai',
    '/settings',
];

const requiresAuth = (path: string): boolean =>
    APP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

export default defineNuxtRouteMiddleware((to) => {
    // Client-side only: public pages still SSR for crawlers; the redirects below
    // only steer the in-browser session.
    if (import.meta.server) {
        return;
    }

    const auth = useAuthStore();

    if (auth.isAuthenticated) {
        // Convenience redirects for the two app-entry routes only. Content pages
        // (blog, discover, about, pricing, …) stay open — we just don't link to
        // them from the authed UI.
        if (to.path === '/' || to.path === '/login') {
            return navigateTo('/dashboard');
        }
        return;
    }

    // Logged out: the app requires sign-in; all public content is open.
    if (requiresAuth(to.path)) {
        return navigateTo('/login');
    }
});
