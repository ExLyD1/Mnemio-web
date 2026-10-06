import { useRequestHeaders, useState, type Ref } from '#imports';

/**
 * Best-effort visitor country, read from CDN geo headers during the SSR pass.
 *
 * Mnemio is not on Vercel, so `x-vercel-ip-country` alone is not enough — we
 * check the headers set by the CDNs this app actually sits behind (Cloudflare
 * first), and fall back through the others so the same code works if hosting
 * changes.
 *
 * Returns `null` when no header is present. Callers must then omit `address` from
 * the Paddle call so Paddle geolocates from the visitor's IP itself — which is
 * also what happens at checkout, so preview and checkout agree either way. We
 * deliberately return `null` rather than an `'OTHERS'`-style sentinel so there is
 * no magic string that could leak into Paddle as a country code.
 *
 * Request headers are only readable during the SSR pass, and `PricePreview()` only
 * runs in the browser — so the resolved code is held in `useState`, which Nuxt
 * serialises into the payload and the client reads back instead of recomputing.
 * A plain `ref()` here would silently resolve to `null` on the client (setup runs
 * again, with no headers), making the detection dead code.
 */
const GEO_HEADERS = [
    'cf-ipcountry', // Cloudflare
    'x-vercel-ip-country', // Vercel
    'x-nf-client-connection-country', // Netlify
    'fastly-client-country', // Fastly
    'x-geo-country', // generic / custom proxies
] as const;

/** Values a CDN may send to mean "I don't know" — treated the same as absent. */
const UNKNOWN = new Set(['XX', 'T1', 'ZZ', '']);

const detect = (headers: Record<string, string | undefined>): string | null => {
    for (const name of GEO_HEADERS) {
        const raw = headers[name];
        if (!raw) {
            continue;
        }
        // Some proxies send a list ("GB,US"); the client's own country is first.
        const code = (raw.split(',')[0] ?? '').trim().toUpperCase();
        if (/^[A-Z]{2}$/.test(code) && !UNKNOWN.has(code)) {
            return code;
        }
    }
    return null;
};

export const useGeoCountry = (): Ref<string | null> =>
    useState<string | null>('geo-country', () =>
        detect(useRequestHeaders(GEO_HEADERS as unknown as string[])),
    );
