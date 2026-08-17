<template>
    <div>
        <section class="mx-auto max-w-[880px] px-6 py-20 text-center">
            <p class="text-eyebrow uppercase text-brand-muted">{{ t('compare.eyebrow') }}</p>
            <h1 class="mt-2 font-display text-display-sm text-cream">{{ t('compare.title') }}</h1>
            <p class="mx-auto mt-4 max-w-[52ch] text-body text-cream-dim">
                {{ t('compare.subtitle') }}
            </p>
            <div class="mt-7 flex justify-center">
                <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                    {{ t('compare.ctaGetStarted') }}
                </UiButton>
            </div>
        </section>

        <section class="mx-auto max-w-[1080px] px-6 pb-16">
            <div class="overflow-x-auto rounded-[20px] border border-line">
                <table class="w-full min-w-[720px] border-collapse text-left">
                    <thead>
                        <tr class="border-b border-line bg-bg-surface">
                            <th class="p-4 text-eyebrow uppercase text-cream-faint">
                                {{ t('compare.tableFeature') }}
                            </th>
                            <th class="p-4 text-eyebrow uppercase text-brand-bright">Mnemio</th>
                            <th class="p-4 text-eyebrow uppercase text-cream-faint">Quizlet</th>
                            <th class="p-4 text-eyebrow uppercase text-cream-faint">Anki</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in rows" :key="row.label" class="border-b border-line">
                            <th
                                scope="row"
                                class="p-4 align-top text-body font-semibold text-cream"
                            >
                                {{ t(row.label) }}
                            </th>
                            <td class="p-4 align-top text-small text-cream">{{ t(row.mnemio) }}</td>
                            <td class="p-4 align-top text-small text-cream-dim">
                                {{ t(row.quizlet) }}
                            </td>
                            <td class="p-4 align-top text-small text-cream-dim">
                                {{ t(row.anki) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="mx-auto max-w-[760px] px-6 pb-20">
            <h2 class="font-display text-h1 text-cream">{{ t('compare.verdictTitle') }}</h2>
            <p class="mt-4 text-body text-cream-dim">{{ t('compare.verdictBody') }}</p>
            <div class="mt-8 flex flex-wrap gap-3">
                <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                    {{ t('compare.ctaGetStarted') }}
                </UiButton>
                <UiButton variant="ghost" @click="navigateTo('/free-quizlet-alternative')">
                    {{ t('quizletAlt.ctaExplore') }}
                </UiButton>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { useHead, useSiteConfig, useT } from '#imports';

definePageMeta({ layout: 'marketing' });

const { t } = useT();

useSeo({ title: t('seo.compareTitle'), description: t('seo.compareDesc') });

const rows = [
    {
        label: 'compare.row1',
        mnemio: 'compare.row1Mnemio',
        quizlet: 'compare.row1Quizlet',
        anki: 'compare.row1Anki',
    },
    {
        label: 'compare.row2',
        mnemio: 'compare.row2Mnemio',
        quizlet: 'compare.row2Quizlet',
        anki: 'compare.row2Anki',
    },
    {
        label: 'compare.row3',
        mnemio: 'compare.row3Mnemio',
        quizlet: 'compare.row3Quizlet',
        anki: 'compare.row3Anki',
    },
    {
        label: 'compare.row4',
        mnemio: 'compare.row4Mnemio',
        quizlet: 'compare.row4Quizlet',
        anki: 'compare.row4Anki',
    },
    {
        label: 'compare.row5',
        mnemio: 'compare.row5Mnemio',
        quizlet: 'compare.row5Quizlet',
        anki: 'compare.row5Anki',
    },
];

const site = useSiteConfig();
const base = (site.url || 'https://mnemio.xyz').replace(/\/$/, '');
useHead({
    script: [
        {
            type: 'application/ld+json',
            key: 'ld-compare',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'ItemList',
                url: `${base}/mnemio-vs-quizlet-vs-anki`,
                name: t('seo.compareTitle'),
                itemListElement: [
                    {
                        '@type': 'SoftwareApplication',
                        position: 1,
                        name: 'Mnemio',
                        applicationCategory: 'EducationApplication',
                    },
                    {
                        '@type': 'SoftwareApplication',
                        position: 2,
                        name: 'Quizlet',
                        applicationCategory: 'EducationApplication',
                    },
                    {
                        '@type': 'SoftwareApplication',
                        position: 3,
                        name: 'Anki',
                        applicationCategory: 'EducationApplication',
                    },
                ],
            }),
        },
    ],
});
</script>
