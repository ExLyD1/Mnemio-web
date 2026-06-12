<template>
    <div
        class="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-20 text-center"
    >
        <div>
            <h1 class="font-display text-h1 text-cream">{{ t('billing.cancel.title') }}</h1>
            <p class="mt-3 max-w-[42ch] text-body text-cream-dim">{{ t('billing.cancel.body') }}</p>
        </div>
        <NuxtLink to="/pricing">
            <UiButton variant="primary">{{ t('billing.cancel.backToPricing') }}</UiButton>
        </NuxtLink>
    </div>
</template>

<script setup lang="ts">
import { useT } from '@/composables/useT';

definePageMeta({ layout: 'marketing' });

const { t } = useT();

useSeo({ title: t('billing.cancel.seoTitle'), noindex: true });
</script>
