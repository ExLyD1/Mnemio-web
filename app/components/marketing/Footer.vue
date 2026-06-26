<template>
    <footer class="border-t border-line bg-bg-surface py-16">
        <div class="mx-auto max-w-[1080px] px-6">
            <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <SharedBrandMark />
                    <p class="mt-3 max-w-[34ch] text-small text-cream-dim">
                        {{ t('footer.tagline') }}
                    </p>
                </div>
                <div v-for="col in columns" :key="col.title">
                    <h5 class="mb-3 text-eyebrow uppercase text-cream-faint">{{ t(col.title) }}</h5>
                    <ul class="space-y-2">
                        <li v-for="l in col.links" :key="l.label">
                            <NuxtLink
                                :to="l.to"
                                class="text-small text-cream-dim transition-colors hover:text-cream"
                            >
                                {{ t(l.label) }}
                            </NuxtLink>
                        </li>
                    </ul>
                </div>
            </div>

            <div
                class="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-small text-cream-faint sm:flex-row sm:items-center sm:justify-between"
            >
                <span>{{ t('footer.rights').replace('{year}', String(year)) }}</span>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { useT } from '#imports';

const { t } = useT();

const year = new Date().getFullYear();

const columns = [
    {
        title: 'footer.colProduct',
        links: [
            { label: 'footer.linkFeatures', to: '/#features' },
            { label: 'footer.linkTryCard', to: '/#demo' },
            { label: 'footer.linkDecks', to: '/discover' },
        ],
    },
    {
        title: 'footer.colCompany',
        links: [
            { label: 'footer.linkAbout', to: '/about' },
            { label: 'footer.linkBlog', to: '/blog' },
            { label: 'footer.linkContact', to: '/about' },
        ],
    },
    {
        title: 'footer.colResources',
        links: [
            { label: 'footer.linkPrivacy', to: '/privacy' },
            { label: 'footer.linkTerms', to: '/terms' },
            { label: 'footer.linkHelp', to: '/about' },
        ],
    },
];
</script>
