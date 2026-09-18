import type { LocaleCode } from '@/i18n';

/**
 * First-visit interface language from the visitor's location (owner decision,
 * Sep 2026): in Ukraine → Ukrainian, anywhere else → English.
 *
 * Location comes from, in order:
 *  1. a country header set by a CDN/edge in front of the app, if any
 *     (Cloudflare `cf-ipcountry`, Vercel `x-vercel-ip-country`, generic
 *     `x-country-code`) — read during SSR;
 *  2. otherwise the browser's time zone (Ukraine's IANA zones) — no IP
 *     lookup, no third-party service, works offline.
 * The user's explicit choice in the language switcher always wins after that.
 */
const UKRAINE_TIME_ZONES = new Set([
    'Europe/Kyiv',
    'Europe/Kiev',
    'Europe/Uzhgorod',
    'Europe/Zaporozhye',
    'Europe/Simferopol',
]);

export const localeForCountry = (country: string): LocaleCode =>
    country.trim().toUpperCase() === 'UA' ? 'uk' : 'en';

export const localeForTimeZone = (tz: string | null | undefined): LocaleCode =>
    tz && UKRAINE_TIME_ZONES.has(tz) ? 'uk' : 'en';

export const countryFromHeaders = (headers: Record<string, string | undefined>): string | null => {
    const raw =
        headers['cf-ipcountry'] ?? headers['x-vercel-ip-country'] ?? headers['x-country-code'];
    // Cloudflare uses XX / T1 for unknown / Tor — treat as "no signal".
    if (!raw || !/^[A-Za-z]{2}$/.test(raw) || /^(XX|T1)$/i.test(raw)) {
        return null;
    }
    return raw.toUpperCase();
};

export const LOCALE_COOKIE = 'i18n_locale';
