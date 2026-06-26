<template>
    <div>
        <section class="border-b border-line bg-mimi-ambient">
            <div class="mx-auto max-w-[1080px] px-6 py-16 text-center">
                <p class="text-eyebrow uppercase text-brand-pale">{{ t('blog.eyebrow') }}</p>
                <h1 class="mt-2 font-display text-display-sm text-cream">{{ t('blog.title') }}</h1>
                <p class="mx-auto mt-3 max-w-[52ch] text-body text-cream-dim">
                    {{ t('blog.subtitle') }}
                </p>
            </div>
        </section>

        <section class="mx-auto max-w-[1080px] px-6 py-16">
            <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <li v-for="post in articles" :key="post.slug">
                    <NuxtLink
                        :to="`/blog/${post.slug}`"
                        class="flex h-full flex-col rounded-[20px] border border-line bg-bg-surface p-6 transition-all hover:shadow-lg hover:shadow-brand/10"
                    >
                        <SharedPill tone="plum" class="self-start">{{ post.tag }}</SharedPill>
                        <h2 class="mt-4 font-display text-h3 text-cream">{{ post.title }}</h2>
                        <p class="mt-2 flex-1 text-small text-cream-dim">{{ post.description }}</p>
                        <p class="mt-4 text-small text-brand-muted">
                            {{ formatDate(post.date) }} ·
                            {{ t('blog.readMinutes').replace('{n}', String(post.readMinutes)) }}
                        </p>
                    </NuxtLink>
                </li>
            </ul>
        </section>
    </div>
</template>

<script setup lang="ts">
import { useT } from '#imports';
import { articles } from '@/data/blog';

definePageMeta({ layout: 'marketing' });

const { t } = useT();

useSeo({ title: t('seo.blogTitle'), description: t('seo.blogDesc') });

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
</script>
