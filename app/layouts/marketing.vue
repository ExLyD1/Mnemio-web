<template>
    <div class="min-h-screen bg-bg-base bg-page-glow text-cream">
        <MarketingNav :current="current" />
        <main>
            <slot />
        </main>
        <MarketingFooter />
    </div>
</template>

<script setup lang="ts">
import { useHead, useSiteConfig } from '#imports';

const route = useRoute();
const current = computed(() => route.path.replace('/', ''));

// Organization + WebSite structured data for the public marketing pages.
const site = useSiteConfig();
const base = (site.url || 'https://mnemio.xyz').replace(/\/$/, '');

const jsonLd = {
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
            sameAs: [
                'https://twitter.com/mnemio',
                'https://github.com/mnemio',
                'https://instagram.com/mnemio',
            ],
        },
        {
            '@type': 'WebSite',
            '@id': `${base}/#website`,
            name: 'Mnemio',
            url: base,
            publisher: { '@id': `${base}/#organization` },
            inLanguage: 'en',
            // Sitelinks search box: lets Google offer an in-results search that lands
            // on the public discover catalog. Valid now that /discover is indexable.
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
};

useHead({
    script: [
        {
            type: 'application/ld+json',
            innerHTML: JSON.stringify(jsonLd),
        },
    ],
});
</script>
