import { defineNuxtPlugin, useHead, useRuntimeConfig } from '#imports';

/**
 * Server-render the Google tag (gtag.js) into <head> using the RUNTIME GA4 id.
 *
 * Universal (not .client) so it ships in the raw SSR HTML — detectable by Google's
 * installation checker and loaded without waiting on client JS. Reading the id from
 * runtimeConfig (not a build-time constant) means it works whether the host provides
 * NUXT_PUBLIC_GA4_ID at build OR only at runtime (e.g. Railway).
 *
 * GA4 enhanced measurement tracks SPA pageviews on browser-history changes, so no
 * per-route wiring is needed here. Empty id ⇒ nothing injected.
 */
export default defineNuxtPlugin(() => {
    const id = String(useRuntimeConfig().public.ga4Id || '');
    if (!id) {
        return;
    }

    useHead({
        script: [
            {
                key: 'ga-gtag-src',
                src: `https://www.googletagmanager.com/gtag/js?id=${id}`,
                async: true,
            },
            {
                key: 'ga-gtag-init',
                innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`,
            },
        ],
    });
});
