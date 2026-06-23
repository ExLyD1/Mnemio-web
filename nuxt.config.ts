export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: false },

    modules: [
        '@pinia/nuxt',
        '@vueuse/nuxt',
        '@nuxtjs/i18n',
        '@nuxt/image',
        '@nuxtjs/color-mode',
        '@nuxtjs/tailwindcss',
        '@nuxtjs/sitemap',
        '@nuxtjs/robots',
    ],

    // Canonical site identity. Used by @nuxtjs/sitemap + @nuxtjs/robots and as the
    // base for canonical/OG absolute URLs (see app/composables/useSeo.ts).
    // Override in prod with NUXT_PUBLIC_SITE_URL.
    site: {
        url: 'https://mnemio.xyz',
        name: 'Mnemio',
    },

    // Private/app + auth surfaces must never be indexed. The sitemap module
    // auto-excludes anything robots disallows. `/discover/**` (public catalog,
    // topic landing pages, and individual public-deck pages) is intentionally NOT
    // listed — it's crawler-facing, server-rendered learning content. Everything
    // here is private user data and stays out of the index + sitemap.
    robots: {
        disallow: [
            '/dashboard',
            '/decks',
            '/study',
            '/review',
            '/statistics',
            '/profile',
            '/onboarding',
            '/ai',
            '/login',
            '/auth',
        ],
    },

    // Static public pages are auto-discovered; this source adds the dynamic
    // public-deck and topic URLs plus the blog articles.
    sitemap: {
        // Source path is outside `/api/**` on purpose — the API proxy route rule would
        // otherwise shadow it and forward to the backend. See server/routes/__sitemap__.
        sources: ['/__sitemap__/urls'],
    },

    app: {
        pageTransition: { name: 'page', mode: 'out-in' },
        head: {
            // `<html lang>` is set reactively from the active i18n locale in
            // app/plugins/02.schema.ts (so it switches to `uk`); no static lang here.
            // `%s` is the per-page title set via useSeo; the default title below fills
            // it on pages that don't set one (so the brand name never doubles up).
            titleTemplate: '%s · Mnemio',
            title: 'Flashcards & spaced repetition',
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1' },
                {
                    name: 'google-site-verification',
                    content: 'o2Qy5YXCdB8Xt1o8mKqP7qWDmLQjBhHIMt7SnSokH1I',
                },
                {
                    name: 'description',
                    content:
                        'Mnemio is a flashcard and spaced-repetition learning app. Create decks, study smarter with an SRS scheduler, discover public decks, and generate cards with AI.',
                },
                {
                    name: 'theme-color',
                    content: '#572E54',
                    media: '(prefers-color-scheme: dark)',
                },
                {
                    name: 'theme-color',
                    content: '#FBF7F2',
                    media: '(prefers-color-scheme: light)',
                },
                { name: 'twitter:card', content: 'summary_large_image' },
                { property: 'og:site_name', content: 'Mnemio' },
                { property: 'og:type', content: 'website' },
            ],
            link: [
                { rel: 'icon', href: '/images/logoico.ico', sizes: 'any' },
                { rel: 'icon', type: 'image/png', href: '/images/icon-192.png', sizes: '192x192' },
                { rel: 'apple-touch-icon', href: '/images/apple-touch-icon.png' },
                { rel: 'manifest', href: '/manifest.webmanifest' },
                // Fonts loaded here (not via CSS @import) so they don't block render.
                // preconnect warms the TLS handshake; the stylesheet uses display=swap.
                { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
                { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
                {
                    rel: 'stylesheet',
                    href: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,400;0,6..12,500;0,6..12,600;0,6..12,700;0,6..12,800;1,6..12,400&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&display=swap',
                },
            ],
        },
    },

    colorMode: {
        // Class names go straight on <html> as `light` / `dark` (no suffix) so
        // they match Tailwind's class-based dark mode and our CSS palette.
        classSuffix: '',
        preference: 'dark', // default/main theme
        fallback: 'dark',
    },

    i18n: {
        defaultLocale: 'en',
        strategy: 'no_prefix',
        locales: [
            { code: 'en', language: 'en-US', name: 'English' },
            { code: 'uk', language: 'uk-UA', name: 'Українська' },
        ],
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: 'i18n_locale',
            redirectOn: 'root',
        },
    },

    runtimeConfig: {
        // Server-only. The backend ORIGIN used by SSR (utils/publicHttp.ts + the
        // dynamic sitemap source) since the same-origin `/api` proxy below is a
        // browser-only route rule, not reachable from the Nitro server fetch.
        // Mirrors NUXT_API_PROXY_TARGET (the proxy target).
        apiProxyTarget: process.env.NUXT_API_PROXY_TARGET ?? 'http://127.0.0.1:3001',
        public: {
            // Empty in dev → client issues relative /api/v1 requests that hit our own
            // origin and are proxied (below) to the backend. This keeps the refresh
            // cookie first-party. Set NUXT_PUBLIC_API_BASE in prod (same-site there).
            apiBase: '',
            // Backend ORIGIN for the Google OAuth redirect, e.g.
            // https://mnemio-backend-production.up.railway.app (local: http://localhost:3001).
            // OAuth initiation must hit the backend directly — NOT the same-origin /api
            // proxy, which follows the backend's 302 and would serve Google's HTML under
            // our origin (CSP/CORS break). Set NUXT_PUBLIC_OAUTH_BASE wherever Google is
            // configured; the callback still returns to this app via the backend's WEB_URL.
            oauthBase: '',

            // ── Analytics (Mixpanel + GA4) ──────────────────────────────────
            // Hard no-op unless analyticsEnabled && consent granted && a token is
            // present. Keep disabled in dev/preview; set the NUXT_PUBLIC_* env
            // vars in prod. See docs/analytics-implementation-plan.md.
            analyticsEnabled: false,
            // Console-log every tracked event in any environment (the dev server
            // always logs). Turn on for a deployed env to verify, off for real prod.
            analyticsDebug: false,
            mixpanelToken: process.env.NUXT_PUBLIC_MIXPANEL_TOKEN ?? '',
            ga4Id: process.env.NUXT_PUBLIC_GA4_ID ?? '',
            // 0..1 sampling for the high-volume per-card event (off by default;
            // study_card_answered is otherwise aggregated into the session event).
            analyticsCardSampling: 0,
        },
    },

    // Same-origin proxy so the HttpOnly refresh cookie (SameSite=Lax) is set on the page
    // origin and sent on every call — keeps auth first-party (no logout on cross-site).
    // Dev → backend on :3001. Prod → set NUXT_API_PROXY_TARGET to the backend's URL
    // (baked at build time; change it ⇒ redeploy).
    routeRules: {
        '/api/**': {
            proxy: `${process.env.NUXT_API_PROXY_TARGET ?? 'http://127.0.0.1:3001'}/api/**`,
        },
        // Uploaded media (avatars, card images/audio) is served by the backend at
        // its origin under `/media/*` (no `/api/v1` prefix). Mirror the API proxy so
        // the relative `/media/...` URLs returned by uploads resolve first-party in
        // dev and prod alike. Without this they 404 against the web origin.
        '/media/**': {
            proxy: `${process.env.NUXT_API_PROXY_TARGET ?? 'http://127.0.0.1:3001'}/media/**`,
        },
    },

    css: ['~/assets/css/main.css'],

    vite: {
        optimizeDeps: {
            include: ['@vue/devtools-core', '@vue/devtools-kit'],
        },
    },
});
