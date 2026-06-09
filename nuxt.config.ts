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
    ],

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
        public: {
            // Empty in dev → client issues relative /api/v1 requests that hit our own
            // origin and are proxied (below) to the backend. This keeps the refresh
            // cookie first-party. Set NUXT_PUBLIC_API_BASE in prod (same-site there).
            apiBase: '',
        },
    },

    // Same-origin proxy so the HttpOnly refresh cookie (SameSite=Lax) is set on the page
    // origin and sent on every call — keeps auth first-party (no logout on cross-site).
    // Dev → backend on :3001. Prod → set NUXT_API_PROXY_TARGET to the backend's URL
    // (baked at build time; change it ⇒ redeploy).
    routeRules: {
        '/api/**': {
            proxy: `${process.env.NUXT_API_PROXY_TARGET || 'http://127.0.0.1:3001'}/api/**`,
        },
    },

    css: ['~/assets/css/main.css'],

    vite: {
        optimizeDeps: {
            include: ['@vue/devtools-core', '@vue/devtools-kit'],
        },
    },
});
