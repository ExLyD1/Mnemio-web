import { defineEventHandler, useRuntimeConfig } from '#imports';

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

const slugify = (s: string): string =>
    s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

/**
 * Dynamic sitemap source for @nuxtjs/sitemap (wired via `sitemap.sources` in
 * nuxt.config.ts). Enumerates the public-deck pages and topic landing pages from
 * the backend so they're discoverable; static public pages are auto-discovered
 * separately. Degrades to `[]` if the backend `/public/*` endpoints are absent or
 * error, so sitemap.xml still ships the static URLs (no 500).
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

    try {
        const cats: { items: Category[] } = await $fetch('/api/v1/public/discover/categories', {
            baseURL: base,
        });
        for (const c of cats.items) {
            urls.push({ loc: `/discover/${slugify(c.subject)}` });
        }
    } catch {
        // Skip topic URLs if categories aren't available.
    }

    return urls;
});
