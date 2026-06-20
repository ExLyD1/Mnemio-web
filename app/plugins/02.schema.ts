import { computed, unref, type Ref } from 'vue';
import { defineNuxtPlugin, useHead, useSiteConfig } from '#imports';

/**
 * Site-wide identity for SEO + GEO. Emits the Organization + WebSite JSON-LD graph
 * on EVERY page (not just the marketing layout) so the brand entity and sitelinks
 * SearchAction ship with the indexable public pages that render in the app-shell
 * `default` layout (/discover/**, /pricing). Also keeps `<html lang>` and `og:locale`
 * in sync with the active i18n locale — the static `htmlAttrs.lang` in nuxt.config
 * never reflected a switch to `uk`.
 *
 * The locale is read from `nuxtApp.$i18n` (the @nuxtjs/i18n global instance), NOT
 * `useI18n()` — the latter must run inside a component `setup`, which a plugin is not.
 * `dependsOn: ['i18n:plugin']` guarantees the i18n instance exists first.
 *
 * `sameAs` is intentionally omitted: no verified social profiles exist yet, and a
 * wrong `sameAs` actively harms entity resolution. Add real, owned URLs here when they exist.
 */
export default defineNuxtPlugin({
    name: 'mnemio:schema',
    dependsOn: ['i18n:plugin'],
    setup(nuxtApp) {
        const site = useSiteConfig();
        const base = (site.url || 'https://mnemio.xyz').replace(/\/$/, '');

        const localeRef = (nuxtApp.$i18n as { locale?: Ref<string> } | undefined)?.locale;
        const htmlLang = computed(() => (unref(localeRef) === 'uk' ? 'uk' : 'en'));
        const ogLocale = computed(() => (unref(localeRef) === 'uk' ? 'uk_UA' : 'en_US'));

        const jsonLd = JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'Organization',
                    '@id': `${base}/#organization`,
                    name: 'Mnemio',
                    url: base,
                    logo: `${base}/images/logo.svg`,
                    description:
                        'Mnemio is a flashcard and spaced-repetition learning app: build decks, study with an SRS scheduler, discover public decks, and generate cards with AI.',
                    knowsAbout: [
                        'Spaced repetition',
                        'Flashcards',
                        'Active recall',
                        'Memory and learning',
                        'Language learning',
                    ],
                },
                {
                    '@type': 'WebSite',
                    '@id': `${base}/#website`,
                    name: 'Mnemio',
                    url: base,
                    publisher: { '@id': `${base}/#organization` },
                    inLanguage: ['en', 'uk'],
                    potentialAction: {
                        '@type': 'SearchAction',
                        target: {
                            '@type': 'EntryPoint',
                            urlTemplate: `${base}/discover?q={search_term_string}`,
                        },
                        'query-input': 'required name=search_term_string',
                    },
                },
            ],
        });

        useHead({
            htmlAttrs: { lang: htmlLang },
            meta: [
                { property: 'og:locale', content: ogLocale },
                { property: 'og:locale:alternate', content: 'uk_UA' },
            ],
            script: [
                {
                    type: 'application/ld+json',
                    // Stable key so the per-page graphs (FAQ, ItemList, …) don't collide
                    // with this one and navigation replaces rather than duplicates.
                    key: 'ld-identity',
                    innerHTML: jsonLd,
                },
            ],
        });
    },
});
