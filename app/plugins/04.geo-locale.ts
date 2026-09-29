import { defineNuxtPlugin, useCookie, useRequestHeaders, useState } from '#imports';
import {
    LOCALE_COOKIE,
    countryFromHeaders,
    localeForCountry,
    localeForTimeZone,
} from '@/utils/geoLocale';

/**
 * Pick the interface language from the visitor's location on their FIRST
 * visit only (no locale cookie yet): Ukraine → Ukrainian, else English.
 * Returning visitors — and anyone who picked a language in the switcher —
 * keep their saved choice (the i18n cookie).
 */
export default defineNuxtPlugin({
    name: 'geo-locale',
    dependsOn: ['i18n:plugin'],
    async setup(nuxtApp) {
        // Set during SSR when the request had no locale cookie and no CDN
        // country header — the client then decides from the browser time zone.
        const pending = useState<boolean>('geo-locale-pending', () => false);
        // Whether the REQUEST already carried a locale cookie. Checked instead
        // of document.cookie at mount, because @nuxtjs/i18n's own browser
        // detection writes that cookie during client boot — reading it later
        // would look like a saved preference and silently disable the
        // time-zone fallback below.
        const hadCookieOnLoad = useState<boolean>('geo-locale-had-cookie', () => false);
        const i18n = nuxtApp.$i18n as {
            locale: { value: string };
            setLocale: (code: 'en' | 'uk') => Promise<void>;
        };

        if (import.meta.server) {
            const headers = useRequestHeaders([
                'cookie',
                'cf-ipcountry',
                'x-vercel-ip-country',
                'x-country-code',
            ]);
            const hasLocaleCookie = new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=`).test(
                headers.cookie ?? '',
            );
            hadCookieOnLoad.value = hasLocaleCookie;
            if (hasLocaleCookie) {
                return;
            }
            const country = countryFromHeaders(headers);
            if (country) {
                const chosen = localeForCountry(country);
                await i18n.setLocale(chosen);
                // Persist the server's choice in the SAME cookie the client
                // reads on boot. Without this the two sides decide
                // independently — the server from this header, the client from
                // navigator.language / the time zone — and they disagree
                // whenever those point different ways. Anything rendered after
                // hydration (the account popover is teleported, so it only
                // renders on click) then used the client's locale while the
                // server-rendered page around it kept the server's: an English
                // page with a Ukrainian menu in it.
                useCookie<string>(LOCALE_COOKIE, {
                    path: '/',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 365,
                }).value = chosen;
                return;
            }
            pending.value = true;
            return;
        }

        if (!pending.value) {
            return;
        }
        // After hydration, so the switch doesn't fight the server-rendered HTML.
        nuxtApp.hook('app:mounted', async () => {
            pending.value = false;
            // An explicit saved choice always wins; only decide for a visitor
            // who arrived without one.
            if (hadCookieOnLoad.value) {
                return;
            }
            let tz: string | null = null;
            try {
                tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            } catch {
                tz = null;
            }
            const target = localeForTimeZone(tz);
            if (i18n.locale.value !== target) {
                await i18n.setLocale(target);
            }
        });
    },
});
