import { defineEventHandler } from 'h3';
import { useRuntimeConfig } from '#imports';
import { articles } from '../../../app/data/blog';
import { SUBJECTS } from '../../../app/utils/subjects';

interface SitemapDeck {
    id: string;
    updatedAt?: string | null;
}
interface SitemapDecksPage {
    items: SitemapDeck[];
    nextCursor: string | null;
}
interface Category {
    subject: string;
    count: number;
}

/**
 * Dynamic sitemap source for @nuxtjs/sitemap (wired via `sitemap.sources` in
 * nuxt.config.ts). Enumerates the public-deck pages, topic landing pages, and blog
 * articles so they're discoverable; static public pages are auto-discovered separately.
 *
 * NOTE: this lives under `server/routes/__sitemap__/` (path `/__sitemap__/urls`), NOT
 * `server/api/**`. The `/api/**` proxy route rule in nuxt.config forwards everything
 * under `/api` to the backend, which would shadow an `/api/__sitemap__/urls` handler and
 * return the backend's 502/404 instead of running this code.
 *
 * Degrades to the always-available blog URLs if the backend `/public/*` endpoints are
 * absent or error, so sitemap.xml still ships (no 500).
 */
export default defineEventHandler(async (event) => {
    const base = useRuntimeConfig(event).apiProxyTarget;
    const urls: { loc: string; lastmod?: string }[] = [];

    try {
        // Walk the paginated public-deck list (cap pages to stay bounded).
        let cursor: string | null = null;
        for (let page = 0; page < 200; page++) {
            const res: SitemapDecksPage = await $fetch('/api/v1/public/sitemap/decks', {
                baseURL: base,
                query: { cursor: cursor ?? undefined },
            });
            for (const d of res.items) {
                const loc = `/discover/sets/${d.id}`;
                urls.push(d.updatedAt ? { loc, lastmod: d.updatedAt } : { loc });
            }
            if (!res.nextCursor) {
                break;
            }
            cursor = res.nextCursor;
        }
    } catch {
        // Backend public endpoints not available yet — skip deck URLs.
    }

    // Topic pages: the fixed subject slugs only (never DB values or legacy
    // slugs, which 301), minus subjects with no public decks when the counts
    // are available.
    let subjects: readonly string[] = SUBJECTS;
    try {
        const taxonomy: { subjects: string[] } = await $fetch('/api/v1/public/taxonomy', {
            baseURL: base,
        });
        if (taxonomy.subjects.length) {
            subjects = taxonomy.subjects;
        }
    } catch {
        // Fall back to the compiled list.
    }
    try {
        const cats: { items: Category[] } = await $fetch('/api/v1/public/discover/categories', {
            baseURL: base,
        });
        const empty = new Set(cats.items.filter((c) => c.count === 0).map((c) => c.subject));
        subjects = subjects.filter((s) => !empty.has(s));
    } catch {
        // No counts: list every subject.
    }
    for (const s of subjects) {
        urls.push({ loc: `/discover/${s}` });
    }

    // Static blog articles (hand-authored, always available — no backend dependency).
    for (const a of articles) {
        urls.push({ loc: `/blog/${a.slug}`, lastmod: a.date });
    }

    return urls;
});
