<template>
    <div>
        <section class="border-b border-line bg-mimi-ambient">
            <div
                class="mx-auto flex max-w-[1080px] flex-col items-center gap-6 px-6 py-20 text-center sm:flex-row sm:text-left"
            >
                <div class="flex-1">
                    <p class="text-eyebrow uppercase text-brand-pale">{{ t('about.eyebrow') }}</p>
                    <h1 class="mt-2 font-display text-display-sm text-cream">
                        {{ t('about.title1') }}<span class="italic">{{ t('about.titleEm') }}</span>
                    </h1>
                    <p class="mt-3 max-w-[48ch] text-body text-cream-dim">
                        {{ t('about.subtitle') }}
                    </p>
                </div>
                <SharedMimi :size="150" />
            </div>
        </section>

        <section class="mx-auto max-w-[1080px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">{{ t('about.missionEyebrow') }}</p>
            <h2 class="mt-2 max-w-[24ch] font-display text-h1 text-cream">
                {{ t('about.missionTitle') }}
            </h2>
            <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="v in values"
                    :key="v.title"
                    class="rounded-[20px] border border-line border-l-2 border-l-brand-bright bg-bg-surface p-6 transition-all hover:shadow-lg hover:shadow-brand/10"
                >
                    <h3 class="font-display text-h3 text-cream">{{ t(v.title) }}</h3>
                    <p class="mt-2 text-small text-cream-dim">{{ t(v.body) }}</p>
                </div>
            </div>
        </section>

        <section class="mx-auto max-w-[1080px] px-6 pb-16">
            <p class="text-eyebrow uppercase text-brand-muted">{{ t('about.builtWith') }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
                <SharedPill v-for="tech in stack" :key="tech" tone="plum">{{ tech }}</SharedPill>
            </div>
        </section>

        <section class="border-t border-line">
            <div class="mx-auto max-w-[1080px] px-6 py-20 text-center">
                <h2 class="font-display text-h1 text-cream">
                    {{ t('about.ctaTitle1')
                    }}<span class="italic">{{ t('about.ctaTitleEm') }}</span>
                </h2>
                <div class="mt-6 flex justify-center gap-3">
                    <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                        {{ t('about.ctaGetStarted') }}
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

useSeo({ title: t('seo.aboutTitle'), description: t('seo.aboutDesc') });

// AboutPage that names Mnemio as its main entity, binding this page to the
// site-wide Organization (defined in app/plugins/02.schema.ts) for E-E-A-T.
const site = useSiteConfig();
const base = (site.url || 'https://mnemio.xyz').replace(/\/$/, '');
useHead({
    script: [
        {
            type: 'application/ld+json',
            key: 'ld-about',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'AboutPage',
                url: `${base}/about`,
                name: t('seo.aboutTitle'),
                description: t('seo.aboutDesc'),
                mainEntity: { '@id': `${base}/#organization` },
            }),
        },
    ],
});

const values = [
    { title: 'about.value1Title', body: 'about.value1Body' },
    { title: 'about.value2Title', body: 'about.value2Body' },
    { title: 'about.value3Title', body: 'about.value3Body' },
    { title: 'about.value4Title', body: 'about.value4Body' },
    { title: 'about.value5Title', body: 'about.value5Body' },
    { title: 'about.value6Title', body: 'about.value6Body' },
];

const stack = ['Nuxt 4', 'Vue 3', 'TypeScript', 'Tailwind CSS', 'Pinia', 'Zod'];
</script>
