export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: true },

    modules: [
        '@pinia/nuxt',
        '@vueuse/nuxt',
        '@nuxtjs/i18n',
        '@nuxt/image',
        '@nuxtjs/color-mode',
        '@nuxtjs/tailwindcss',
    ],

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
            apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:3001',
        },
    },

    css: ['~/assets/css/main.css'],

    vite: {
        optimizeDeps: {
            include: ['@vue/devtools-core', '@vue/devtools-kit'],
        },
    },
});
