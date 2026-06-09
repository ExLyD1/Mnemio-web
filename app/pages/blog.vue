<template>
    <div>
        <section class="border-b border-line bg-mimi-ambient">
            <div class="mx-auto max-w-[1080px] px-6 py-16 text-center">
                <p class="text-eyebrow uppercase text-brand-pale">{{ t('blog.eyebrow') }}</p>
                <h1 class="mt-2 font-display text-display-sm text-cream">{{ t('blog.title') }}</h1>
                <p class="mt-3 text-body text-cream-dim">
                    {{ t('blog.subtitle') }}
                </p>
            </div>
        </section>

        <section class="mx-auto max-w-[680px] px-6 py-20">
            <div
                class="relative grid place-items-center gap-5 rounded-[28px] border border-dashed border-brand-bright/60 bg-bg-surface px-6 py-16 text-center"
            >
                <span
                    class="absolute -top-3 rounded-full border border-brand-bright/60 bg-bg-base px-3 py-1 text-small text-brand-pale"
                >
                    {{ t('blog.draftBadge') }}
                </span>
                <SharedMimi :size="120" />
                <h2 class="font-display text-h1 text-cream">{{ t('blog.emptyTitle') }}</h2>
                <p class="max-w-[40ch] text-body text-cream-dim">
                    {{ t('blog.emptyBody') }}
                </p>
                <div class="flex gap-3">
                    <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                        {{ t('blog.ctaGetStarted') }}
                    </UiButton>
                    <UiButton variant="ghost" @click="navigateTo('/about')">{{
                        t('blog.ctaAbout')
                    }}</UiButton>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { useT } from '#imports';

definePageMeta({ layout: 'marketing' });

const { t } = useT();
</script>
