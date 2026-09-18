import { defineNuxtPlugin, useRequestHeaders, useState } from '#imports';
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
            if (hasLocaleCookie) {
                return;
            }
            const country = countryFromHeaders(headers);
            if (country) {
                await i18n.setLocale(localeForCountry(country));
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
