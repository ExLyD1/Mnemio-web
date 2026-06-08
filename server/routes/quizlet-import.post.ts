// Best-effort import of a PUBLIC Quizlet set by URL. The browser can't fetch
// quizlet.com directly (CORS), so this runs server-side. Quizlet renders with
// Next.js and changes its markup often / may block bots — so we parse defensively
// and surface a typed error instead of throwing raw. Lives under server/routes
// (not server/api) on purpose: nuxt.config proxies /api/** to the backend.
import { defineEventHandler, readBody, createError } from 'h3';

interface ParsedCard {
    word: string;
    definition: string;
}

const isQuizletSetUrl = (raw: string): URL | null => {
    try {
        const u = new URL(raw);
        if (!/(^|\.)quizlet\.com$/i.test(u.hostname)) {
            return null;
        }
        return u;
    } catch {
        return null;
    }
};

const decodeEntities = (s: string): string =>
    s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&#x27;/gi, "'");

// Quizlet's term objects carry `word` + `definition` fields; walk any parsed JSON
// embedded in the page and collect those pairs (dedup by word, cap 200).
const collectCards = (node: unknown, out: ParsedCard[], seen: Set<string>): void => {
    if (out.length >= 200 || !node || typeof node !== 'object') {
        return;
    }
    if (Array.isArray(node)) {
        for (const item of node) {
            collectCards(item, out, seen);
        }
        return;
    }
    const obj = node as Record<string, unknown>;
    const { word, definition } = obj;
    if (
        typeof word === 'string' &&
        typeof definition === 'string' &&
        word.trim() &&
        definition.trim()
    ) {
        const key = word.trim().toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            out.push({ word: word.trim(), definition: definition.trim() });
        }
    }
    for (const value of Object.values(obj)) {
        collectCards(value, out, seen);
    }
};

const extractJsonBlobs = (html: string): string[] => {
    const blobs: string[] = [];
    const re = /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) {
        if (m[1]) {
            blobs.push(m[1]);
        }
    }
    return blobs;
};

const firstMatch = (html: string, re: RegExp): string => {
    const m = html.match(re);
    return m ? m[1] : '';
};

const extractTitle = (html: string): string => {
    const raw =
        firstMatch(html, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i) ||
        firstMatch(html, /<title>([^<]*)<\/title>/i);
    return decodeEntities(raw)
        .replace(/\s*\|\s*Quizlet\s*$/i, '')
        .replace(/\s+Flashcards?$/i, '')
        .trim();
};

export default defineEventHandler(async (event) => {
    const body = await readBody<{ url?: string } | null>(event);
    const url = isQuizletSetUrl(String(body?.url ?? '').trim());
    if (!url) {
        throw createError({ statusCode: 400, statusMessage: 'QUIZLET_INVALID_URL' });
    }

    let html: string;
    try {
        const res = await fetch(url.toString(), {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
                    '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                Accept: 'text/html,application/xhtml+xml',
            },
        });
        if (!res.ok) {
            throw new Error(`status ${res.status}`);
        }
        html = await res.text();
    } catch {
        throw createError({ statusCode: 502, statusMessage: 'QUIZLET_FETCH_FAILED' });
    }

    const cards: ParsedCard[] = [];
    const seen = new Set<string>();
    for (const blob of extractJsonBlobs(html)) {
        let parsed: unknown;
        try {
            parsed = JSON.parse(blob);
        } catch {
            continue;
        }
        collectCards(parsed, cards, seen);
        if (cards.length >= 200) {
            break;
        }
    }

    if (!cards.length) {
        throw createError({ statusCode: 422, statusMessage: 'QUIZLET_PARSE_FAILED' });
    }

    return { title: extractTitle(html), cards };
});
