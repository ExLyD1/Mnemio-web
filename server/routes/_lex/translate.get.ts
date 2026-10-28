import { defineEventHandler, getQuery, createError } from 'h3';
import { SUPPORTED_LANGS } from '../../../app/utils/subjects';
import { makeCache } from './_cache';

const VALID_LANGS: ReadonlySet<string> = new Set(SUPPORTED_LANGS);

const CACHE_MAX = 2000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = makeCache(CACHE_MAX, CACHE_TTL_MS);

// MyMemory's translation-memory matches can carry noise: an ambiguous
// "X / Y" pair when it isn't confident, raw HTML/XML fragments from the
// source corpus, HTML entities, and trailing punctuation that otherwise
// defeats de-duplication ("Страхування" vs "Страхування:").
const clean = (s: string): string => {
    const firstAlt = s.split(' / ')[0] ?? s;
    const noTags = firstAlt.replace(/<[^>]*>/g, ' ').replace(/&#\d+;|&[a-z]+;/gi, ' ');
    return noTags
        .replace(/[:;,.!?]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

// Reject anything that still looks like markup/junk after cleaning, or is
// implausibly long for a single-word/short-phrase suggestion.
const looksLikeJunk = (s: string): boolean => /[<>{}]/.test(s) || s.length > 120;

interface MyMemoryMatch {
    translation?: string;
    quality?: number | string;
}
interface MyMemoryResponse {
    responseData?: { translatedText?: string };
    matches?: MyMemoryMatch[];
}

/**
 * GET /_lex/translate?from=de&to=uk&q=Versicherung -> { items: string[] }
 *
 * Suggested translations while typing a card's term (#7 of the plan): `from`
 * is the deck's target language (the word being typed), `to` is the deck's
 * source language (the definition field) — same naming the rest of the app
 * uses for sourceLanguage/targetLanguage. Backed by MyMemory (free, no key,
 * CORS-open, returns ranked alternatives) — there is no translate endpoint on
 * our own backend and /ai/enrich-words is a capped LLM call, unsuited to a
 * per-keystroke feature. See the plan's Open questions for the shared-quota
 * trade-off of proxying this instead of calling it from the browser.
 */
export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const from = typeof query.from === 'string' ? query.from.toLowerCase() : '';
    const to = typeof query.to === 'string' ? query.to.toLowerCase() : '';
    const q = typeof query.q === 'string' ? query.q.trim() : '';

    if (!VALID_LANGS.has(from) || !VALID_LANGS.has(to) || q.length < 1 || q.length > 80) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid from/to or q' });
    }
    if (from === to) {
        // Monolingual deck (CLAUDE.md: source === target is a legitimate way
        // to learn) — nothing to translate.
        return { items: [] };
    }

    const cacheKey = `${from}|${to}:${q.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) {
        return { items: cached };
    }

    try {
        const res = await $fetch<MyMemoryResponse>('https://api.mymemory.translated.net/get', {
            query: { q, langpair: `${from}|${to}` },
            signal: AbortSignal.timeout(3500),
        });

        const seen = new Set<string>();
        const items: string[] = [];
        const push = (raw: string | undefined) => {
            if (!raw || items.length >= 3) {
                return;
            }
            const text = clean(raw);
            const key = text.toLowerCase();
            if (!text || looksLikeJunk(text) || seen.has(key)) {
                return;
            }
            seen.add(key);
            items.push(text);
        };

        push(res.responseData?.translatedText);
        for (const m of res.matches ?? []) {
            const quality = typeof m.quality === 'string' ? Number(m.quality) : (m.quality ?? 0);
            if (quality < 50) {
                continue;
            }
            push(m.translation);
        }

        cache.set(cacheKey, items);
        return { items };
    } catch {
        return { items: [], degraded: true };
    }
});
