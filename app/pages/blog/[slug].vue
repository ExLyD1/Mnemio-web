<template>
    <article v-if="post" class="mx-auto max-w-[720px] px-6 py-16">
        <nav class="mb-6 flex items-center gap-2 text-small text-brand-muted">
            <NuxtLink to="/blog" class="hover:text-cream">{{ t('blog.title') }}</NuxtLink>
            <span>/</span>
            <span class="line-clamp-1 text-cream">{{ tr.title }}</span>
        </nav>

        <header class="flex flex-col gap-3">
            <SharedPill tone="plum" class="self-start">{{ tr.tag }}</SharedPill>
            <h1 class="font-display text-display-sm text-cream">{{ tr.title }}</h1>
            <p class="text-small text-brand-muted">
                {{ formatDate(post.date) }} ·
                {{ t('blog.readMinutes').replace('{n}', String(tr.readMinutes)) }}
            </p>
        </header>

        <div class="mt-8 flex flex-col gap-5">
            <template v-for="(block, i) in tr.body" :key="i">
                <h2 v-if="block.type === 'h2'" class="mt-4 font-display text-h2 text-cream">
                    {{ block.text }}
                </h2>
                <p v-else-if="block.type === 'p'" class="text-body leading-relaxed text-cream-dim">
                    {{ block.text }}
                </p>
                <ul
                    v-else-if="block.type === 'ul'"
                    class="flex list-disc flex-col gap-2 pl-5 text-body text-cream-dim"
                >
                    <li v-for="(item, j) in block.items" :key="j">{{ item }}</li>
                </ul>
            </template>
        </div>

        <div class="mt-12 rounded-[20px] border border-line bg-mimi-ambient p-6 text-center">
            <p class="font-display text-h3 text-cream">{{ t('blog.ctaTitle') }}</p>
            <p class="mx-auto mt-1 max-w-[40ch] text-small text-cream-dim">
                {{ t('blog.ctaBody') }}
            </p>
            <UiButton variant="primary" class="mt-4" @click="navigateTo('/login?tab=register')">
                {{ t('blog.ctaGetStarted') }}
            </UiButton>
        </div>
    </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { createError, useHead, useRoute, useSiteConfig, useT } from '#imports';
import { useAppLocale } from '@/composables/useAppLocale';
import { getArticle } from '@/data/blog';

definePageMeta({ layout: 'marketing' });

const { t } = useT();
const { current } = useAppLocale();
const route = useRoute();
const site = useSiteConfig();

const slug = computed(() => String(route.params.slug ?? ''));
const post = computed(() => getArticle(slug.value));

// Unknown slug → real 404 at setup level (no empty indexable page).
if (!post.value) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' });
}

// Non-null: guarded by the throw above, and slug never changes after initial load.
const tr = computed(() => post.value!.translations[current.value]);

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(current.value === 'uk' ? 'uk-UA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

useSeo({
    title: tr.value.title,
    description: tr.value.description,
    type: 'article',
});

const base = (site.url || 'https://mnemio.xyz').replace(/\/$/, '');
useHead({
    script: [
        {
            type: 'application/ld+json',
            key: 'ld-blogpost',
            innerHTML: computed(() => {
                const p = post.value;
                if (!p) {
                    return '{}';
                }
                const t2 = p.translations[current.value];
                const url = `${base}/blog/${p.slug}`;
                return JSON.stringify({
                    '@context': 'https://schema.org',
                    '@graph': [
                        {
                            '@type': 'BreadcrumbList',
                            itemListElement: [
                                {
                                    '@type': 'ListItem',
                                    position: 1,
                                    name: t('blog.title'),
                                    item: `${base}/blog`,
                                },
                                {
                                    '@type': 'ListItem',
                                    position: 2,
                                    name: t2.title,
                                    item: url,
                                },
                            ],
                        },
                        {
                            '@type': 'BlogPosting',
                            headline: t2.title,
                            description: t2.description,
                            url,
                            mainEntityOfPage: url,
                            datePublished: p.date,
                            dateModified: p.date,
                            inLanguage: current.value,
                            author: {
                                '@type': 'Organization',
                                name: 'Mnemio',
                                '@id': `${base}/#organization`,
                            },
                            publisher: { '@id': `${base}/#organization` },
                        },
                    ],
                });
            }),
        },
    ],
});
</script>
