import { useHead, useRoute, useSeoMeta, useSiteConfig } from '#imports';

export interface SeoOptions {
    /** Page title (without the ` · Mnemio` suffix — that's applied by titleTemplate). */
    title: string;
    /** Meta + OG/Twitter description. */
    description: string;
    /** Absolute or root-relative OG/Twitter image. Defaults to the brand OG image. */
    image?: string;
    /** Alt text for the OG/Twitter image. Defaults to the title. */
    imageAlt?: string;
    /** OG type — `website` (default) or `article` for blog posts. */
    type?: 'website' | 'article';
    /** When true, emit `noindex, nofollow` (app/auth pages). */
    noindex?: boolean;
}

/**
 * Per-page SEO. Wraps `useSeoMeta` for the title/description/OG/Twitter tags and
 * `useHead` for the canonical link, deriving absolute URLs from the configured
 * `site.url` (see nuxt.config.ts). Call once per page in `<script setup>`.
 */
export const useSeo = (opts: SeoOptions) => {
    const site = useSiteConfig();
    const route = useRoute();

    const base = (site.url || '').replace(/\/$/, '');
    const toAbsolute = (path: string) =>
        /^https?:\/\//.test(path) ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`;

    const image = toAbsolute(opts.image ?? '/images/OGLogo.jpg');
    const canonical = toAbsolute(route.path);

    useSeoMeta({
        title: opts.title,
        description: opts.description,
        ogType: opts.type ?? 'website',
        ogTitle: opts.title,
        ogDescription: opts.description,
        ogImage: image,
        ogImageAlt: opts.imageAlt ?? opts.title,
        ogUrl: canonical,
        twitterTitle: opts.title,
        twitterDescription: opts.description,
        twitterImage: image,
        twitterImageAlt: opts.imageAlt ?? opts.title,
        robots: opts.noindex ? 'noindex, nofollow' : 'index, follow',
    });

    useHead({
        link: [{ rel: 'canonical', href: canonical }],
    });
};
