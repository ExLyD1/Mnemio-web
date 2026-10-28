import { defineEventHandler, getQuery, createError } from 'h3';
import { SUPPORTED_LANGS } from '../../../app/utils/subjects';
import { makeCache } from './_cache';

// NOTE: lives under `server/routes/_lex/`, NOT `server/api/**` — the
// `/api/**` proxy route rule in nuxt.config.ts forwards everything under
// `/api` straight to the backend, which would shadow a `/api/_lex/*` handler.
// Same trap the sitemap source (`server/routes/__sitemap__/urls.ts`) avoids.

const VALID_LANGS: ReadonlySet<string> = new Set(SUPPORTED_LANGS);

const CACHE_MAX = 2000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = makeCache(CACHE_MAX, CACHE_TTL_MS);

// Wikimedia asks API consumers to identify themselves with a descriptive
// User-Agent rather than a generic one.
const USER_AGENT = 'Mnemio-StudyApp/1.0 (+https://mnemio.app; word-completion feature)';

type OpenSearchResponse = [string, string[], string[]?, string[]?];

/**
 * GET /_lex/complete?lang=de&q=versi -> { items: string[], degraded?: true }
 *
 * Word-completion suggestions while typing a card's term (#6 of the plan).
 * Backed by Wikimedia's OpenSearch API (one Wiktionary edition per language,
 * free, no key, CORS-open) — there is no dictionary/autocomplete endpoint on
 * our own backend. Proxied (rather than called from the browser) so lookups
 * are cached across users, the user's IP/keystrokes don't reach a third
 * party directly, and the provider can be swapped in one file later.
 */
export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const lang = typeof query.lang === 'string' ? query.lang.toLowerCase() : '';
    const q = typeof query.q === 'string' ? query.q.trim() : '';

    if (!VALID_LANGS.has(lang) || q.length < 1 || q.length > 80) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid lang or q' });
    }

    const cacheKey = `${lang}:${q.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return { items: cached };
    }

    try {
        const res = await $fetch<OpenSearchResponse>(`https://${lang}.wiktionary.org/w/api.php`, {
            query: {
                action: 'opensearch',
                format: 'json',
                namespace: 0,
                limit: 8,
                search: q,
            },
            headers: { 'User-Agent': USER_AGENT },
            signal: AbortSignal.timeout(3500),
        });
        const items = Array.isArray(res[1]) ? res[1].slice(0, 8) : [];
        cache.set(cacheKey, items);
        return { items };
    } catch {
        // Never surface a 500 into the typing path — degrade quietly, the FE
        // just closes the suggestion dropdown.
        return { items: [], degraded: true };
    }
});
