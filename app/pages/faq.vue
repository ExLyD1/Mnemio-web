<template>
    <div>
        <section class="mx-auto max-w-[880px] px-6 py-16 text-center">
            <p class="text-eyebrow uppercase text-brand-muted">{{ t('faqPage.eyebrow') }}</p>
            <h1 class="mt-2 font-display text-display-sm text-cream">{{ t('faqPage.title') }}</h1>
            <p class="mx-auto mt-3 max-w-[52ch] text-body text-cream-dim">
                {{ t('faqPage.subtitle') }}
            </p>
        </section>

        <section class="mx-auto max-w-[760px] px-6 pb-16">
            <div class="flex flex-col gap-4">
                <div
                    v-for="item in faqs"
                    :key="item.q"
                    class="rounded-[20px] border border-line bg-bg-surface p-6"
                >
                    <h2 class="font-display text-h3 text-cream">{{ t(item.q) }}</h2>
                    <p class="mt-2 text-body text-cream-dim">{{ t(item.a) }}</p>
                </div>
            </div>
        </section>

        <section class="border-t border-line">
            <div class="mx-auto max-w-[1080px] px-6 py-20 text-center">
                <h2 class="font-display text-h1 text-cream">{{ t('faqPage.ctaTitle') }}</h2>
                <p class="mx-auto mt-3 max-w-[44ch] text-body text-cream-dim">
                    {{ t('faqPage.ctaBody') }}
                </p>
                <div class="mt-6 flex justify-center gap-3">
                    <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                        {{ t('faqPage.ctaGetStarted') }}
                    </UiButton>
                    <UiButton variant="ghost" @click="navigateTo('/discover')">
                        {{ t('about.ctaExplore') }}
                    </UiButton>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { useHead, useSiteConfig, useT } from '#imports';

definePageMeta({ layout: 'marketing' });

const { t } = useT();

useSeo({ title: t('seo.faqTitle'), description: t('seo.faqDesc') });

const faqs = [
    { q: 'faqPage.q1Q', a: 'faqPage.q1A' },
    { q: 'faqPage.q2Q', a: 'faqPage.q2A' },
    { q: 'faqPage.q3Q', a: 'faqPage.q3A' },
    { q: 'faqPage.q4Q', a: 'faqPage.q4A' },
    { q: 'faqPage.q5Q', a: 'faqPage.q5A' },
    { q: 'faqPage.q6Q', a: 'faqPage.q6A' },
    { q: 'faqPage.q7Q', a: 'faqPage.q7A' },
    { q: 'faqPage.q8Q', a: 'faqPage.q8A' },
    { q: 'faqPage.q9Q', a: 'faqPage.q9A' },
    { q: 'faqPage.q10Q', a: 'faqPage.q10A' },
    { q: 'faqPage.q11Q', a: 'faqPage.q11A' },
    { q: 'faqPage.q12Q', a: 'faqPage.q12A' },
];

const site = useSiteConfig();
const base = (site.url || 'https://mnemio.xyz').replace(/\/$/, '');
useHead({
    script: [
        {
            type: 'application/ld+json',
            key: 'ld-faq',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                url: `${base}/faq`,
                mainEntity: faqs.map((f) => ({
                    '@type': 'Question',
                    name: t(f.q),
                    acceptedAnswer: { '@type': 'Answer', text: t(f.a) },
                })),
            }),
        },
    ],
});
</script>
