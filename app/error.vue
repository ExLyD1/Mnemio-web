<template>
    <div class="flex min-h-screen flex-col bg-bg-base bg-page-glow text-cream">
        <div class="flex items-center justify-between px-6 py-5">
            <NuxtLink to="/"><SharedBrandMark /></NuxtLink>
            <UiButton variant="ghost" class="!px-4 !py-2 text-small" @click="goHome">
                {{ t('errorPage.goHome') }}
            </UiButton>
        </div>

        <main class="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <p class="select-none font-display text-[120px] leading-none text-brand-bright">
                {{ code }}
            </p>
            <SharedMimi :size="120" />
            <h1 class="font-display text-display-sm text-cream">{{ title }}</h1>
            <p class="max-w-md text-body text-cream-dim">{{ message }}</p>
            <div class="flex flex-wrap justify-center gap-3">
                <UiButton variant="primary" @click="goTo('/dashboard')">
                    {{ t('errorPage.browseDecks') }}
                </UiButton>
                <UiButton variant="ghost" @click="goTo('/')">{{ t('errorPage.goHome') }}</UiButton>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { useT } from '@/composables/useT';

const props = defineProps<{ error: { statusCode?: number; message?: string } | null }>();

const { t } = useT();

const code = computed(() => props.error?.statusCode ?? 500);
const isNotFound = computed(() => code.value === 404);
const title = computed(() =>
    t(isNotFound.value ? 'errorPage.notFoundTitle' : 'errorPage.genericTitle'),
);
const message = computed(() =>
    t(isNotFound.value ? 'errorPage.notFoundBody' : 'errorPage.genericBody'),
);

const goTo = (to: string) => clearError({ redirect: to });
const goHome = () => goTo('/');
</script>
