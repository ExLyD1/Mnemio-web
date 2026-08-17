<template>
    <div>
        <section class="mx-auto max-w-[1080px] px-6 py-20 text-center">
            <p class="text-eyebrow uppercase text-brand-muted">
                {{ t('photoFlashcards.eyebrow') }}
            </p>
            <h1 class="mx-auto mt-2 max-w-[28ch] font-display text-display-sm text-cream">
                {{ t('photoFlashcards.title1')
                }}<span class="italic">{{ t('photoFlashcards.titleEm') }}</span>
            </h1>
            <p class="mx-auto mt-4 max-w-[52ch] text-body text-cream-dim">
                {{ t('photoFlashcards.subtitle') }}
            </p>
            <div class="mt-7 flex flex-wrap justify-center gap-3">
                <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                    {{ t('photoFlashcards.ctaGetStarted') }}
                </UiButton>
                <UiButton variant="ghost" @click="navigateTo('/discover')">
                    {{ t('photoFlashcards.ctaExplore') }}
                </UiButton>
            </div>
        </section>

        <section class="mx-auto max-w-[1080px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">
                {{ t('photoFlashcards.howEyebrow') }}
            </p>
            <h2 class="mt-2 font-display text-h1 text-cream">
                {{ t('photoFlashcards.howTitle') }}
            </h2>
            <ol class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <li
                    v-for="(step, i) in steps"
                    :key="step.title"
                    class="rounded-[20px] border border-line bg-bg-surface p-6"
                >
                    <span
                        class="grid size-9 place-items-center rounded-full bg-brand/30 font-display text-h3 text-lavender"
                        >{{ i + 1 }}</span
                    >
                    <h3 class="mt-4 font-display text-h3 text-cream">{{ t(step.title) }}</h3>
                    <p class="mt-2 text-small text-cream-dim">{{ t(step.body) }}</p>
                </li>
            </ol>
        </section>

        <section class="mx-auto max-w-[1080px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">
                {{ t('photoFlashcards.useCasesEyebrow') }}
            </p>
            <h2 class="mt-2 max-w-[24ch] font-display text-h1 text-cream">
                {{ t('photoFlashcards.useCasesTitle') }}
            </h2>
            <div class="mt-10 grid gap-5 sm:grid-cols-3">
                <div
                    v-for="u in useCases"
                    :key="u.title"
                    class="rounded-[20px] border border-line bg-bg-surface p-6"
                >
                    <h3 class="font-display text-h3 text-cream">{{ t(u.title) }}</h3>
                    <p class="mt-2 text-small text-cream-dim">{{ t(u.body) }}</p>
                </div>
            </div>
        </section>

        <section class="mx-auto max-w-[760px] px-6 pb-16">
            <p class="text-eyebrow uppercase text-brand-muted">
                {{ t('photoFlashcards.faqEyebrow') }}
            </p>
            <h2 class="mt-2 font-display text-h1 text-cream">
                {{ t('photoFlashcards.faqTitle') }}
            </h2>
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

useSeo({ title: t('seo.photoFlashcardsTitle'), description: t('seo.photoFlashcardsDesc') });

const steps = [
    { title: 'photoFlashcards.step1Title', body: 'photoFlashcards.step1Body' },
    { title: 'photoFlashcards.step2Title', body: 'photoFlashcards.step2Body' },
    { title: 'photoFlashcards.step3Title', body: 'photoFlashcards.step3Body' },
    { title: 'photoFlashcards.step4Title', body: 'photoFlashcards.step4Body' },
];

const useCases = [
    { title: 'photoFlashcards.useCase1Title', body: 'photoFlashcards.useCase1Body' },
    { title: 'photoFlashcards.useCase2Title', body: 'photoFlashcards.useCase2Body' },
    { title: 'photoFlashcards.useCase3Title', body: 'photoFlashcards.useCase3Body' },
];

const faqs = [
    { q: 'faqPage.q10Q', a: 'faqPage.q10A' },
    { q: 'faqPage.q11Q', a: 'faqPage.q11A' },
    { q: 'faqPage.q2Q', a: 'faqPage.q2A' },
];

const site = useSiteConfig();
const base = (site.url || 'https://mnemio.xyz').replace(/\/$/, '');
useHead({
    script: [
        {
            type: 'application/ld+json',
            key: 'ld-photo-howto',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'HowTo',
                name: t('seo.photoFlashcardsTitle'),
                description: t('seo.photoFlashcardsDesc'),
                step: steps.map((s) => ({
                    '@type': 'HowToStep',
                    name: t(s.title),
                    text: t(s.body),
                })),
            }),
        },
        {
            type: 'application/ld+json',
            key: 'ld-photo-faq',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                url: `${base}/ai-flashcards-from-photo`,
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
