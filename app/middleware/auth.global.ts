import { useAuthStore } from '@/stores/auth';
import { sanitizeNext } from '@/utils/returnTo';
import { readAccessToken } from '@/utils/authToken';

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

    // The landing page is SSR'd (for crawlers/logged-out visitors) and the auth
    // store's real hydration is an async apiMe() call — so on first client load,
    // isAuthenticated is still false for a brief moment even for a returning,
    // logged-in user, and this middleware would otherwise let the SSR'd landing
    // page flash on screen before hydrate() resolves and something re-routes them.
    // The access token in storage is a synchronous, no-network signal that's good
    // enough to redirect immediately; hydrate() still runs and is the source of
    // truth for actually loading the user and clearing an invalid session.
    const likelyAuthed = auth.isAuthenticated || !!readAccessToken();

    if (likelyAuthed) {
        // Convenience redirects for the two app-entry routes only. Content pages
        // (blog, discover, about, pricing, …) stay open — we just don't link to
        // them from the authed UI.
        if (to.path === '/login') {
            return navigateTo(sanitizeNext(to.query.next) || '/dashboard');
        }
        if (to.path === '/') {
            return navigateTo('/dashboard');
        }
        return;
    }

    // Logged out: the app requires sign-in; all public content is open. Remember
    // where they were headed so we can return them there after login.
    if (requiresAuth(to.path)) {
        return navigateTo(`/login?next=${encodeURIComponent(to.fullPath)}`);
    }
});
