<template>
    <div>
        <section class="mx-auto max-w-[1080px] px-6 py-20 text-center">
            <p class="text-eyebrow uppercase text-brand-muted">{{ t('quizletAlt.eyebrow') }}</p>
            <h1 class="mx-auto mt-2 max-w-[26ch] font-display text-display-sm text-cream">
                {{ t('quizletAlt.title1')
                }}<span class="italic">{{ t('quizletAlt.titleEm') }}</span>
            </h1>
            <p class="mx-auto mt-4 max-w-[52ch] text-body text-cream-dim">
                {{ t('quizletAlt.subtitle') }}
            </p>
            <div class="mt-7 flex flex-wrap justify-center gap-3">
                <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                    {{ t('quizletAlt.ctaGetStarted') }}
                </UiButton>
                <UiButton variant="ghost" @click="navigateTo('/discover')">
                    {{ t('quizletAlt.ctaExplore') }}
                </UiButton>
            </div>
        </section>

        <section class="mx-auto max-w-[880px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">{{ t('quizletAlt.whyEyebrow') }}</p>
            <h2 class="mt-2 font-display text-h1 text-cream">{{ t('quizletAlt.whyTitle') }}</h2>
            <ul class="mt-8 flex flex-col gap-4">
                <li
                    v-for="reason in reasons"
                    :key="reason"
                    class="rounded-[20px] border border-line bg-bg-surface p-5 text-body text-cream-dim"
                >
                    {{ t(reason) }}
                </li>
            </ul>
        </section>

        <section class="mx-auto max-w-[1080px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">{{ t('quizletAlt.whatEyebrow') }}</p>
            <h2 class="mt-2 font-display text-h1 text-cream">{{ t('quizletAlt.whatTitle') }}</h2>
            <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div
                    v-for="f in whatsFree"
                    :key="f.title"
                    class="rounded-[20px] border border-line bg-bg-surface p-6"
                >
                    <h3 class="font-display text-h3 text-cream">{{ t(f.title) }}</h3>
                    <p class="mt-2 text-small text-cream-dim">{{ t(f.body) }}</p>
                </div>
            </div>
            <p class="mt-10 text-center">
                <NuxtLink
                    to="/mnemio-vs-quizlet-vs-anki"
                    class="text-body text-brand-bright underline underline-offset-4 hover:text-cream"
                >
                    {{ t('quizletAlt.compareCta') }}
                </NuxtLink>
            </p>
        </section>

        <section class="mx-auto max-w-[760px] px-6 pb-16">
            <p class="text-eyebrow uppercase text-brand-muted">{{ t('quizletAlt.faqEyebrow') }}</p>
            <h2 class="mt-2 font-display text-h1 text-cream">{{ t('quizletAlt.faqTitle') }}</h2>
            <div class="mt-8 flex flex-col gap-4">
                <div
                    v-for="item in faqs"
                    :key="item.q"
                    class="rounded-[20px] border border-line bg-bg-surface p-6"
                >
                    <h3 class="font-display text-h3 text-cream">{{ t(item.q) }}</h3>
                    <p class="mt-2 text-body text-cream-dim">{{ t(item.a) }}</p>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { useHead, useSiteConfig, useT } from '#imports';

definePageMeta({ layout: 'marketing' });

const { t } = useT();

useSeo({ title: t('seo.quizletAltTitle'), description: t('seo.quizletAltDesc') });

const reasons = ['quizletAlt.why1', 'quizletAlt.why2', 'quizletAlt.why3'];

const whatsFree = [
    { title: 'quizletAlt.what1Title', body: 'quizletAlt.what1Body' },
    { title: 'quizletAlt.what2Title', body: 'quizletAlt.what2Body' },
    { title: 'quizletAlt.what3Title', body: 'quizletAlt.what3Body' },
    { title: 'quizletAlt.what4Title', body: 'quizletAlt.what4Body' },
];

const faqs = [
    { q: 'faqPage.q4Q', a: 'faqPage.q4A' },
    { q: 'faqPage.q5Q', a: 'faqPage.q5A' },
    { q: 'faqPage.q6Q', a: 'faqPage.q6A' },
    { q: 'faqPage.q7Q', a: 'faqPage.q7A' },
];

const site = useSiteConfig();
const base = (site.url || 'https://mnemio.xyz').replace(/\/$/, '');
useHead({
    script: [
        {
            type: 'application/ld+json',
            key: 'ld-quizlet-alt-faq',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                url: `${base}/free-quizlet-alternative`,
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
