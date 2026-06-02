<template>
    <div class="flex min-h-screen flex-col bg-bg-base bg-page-glow text-cream">
        <div class="flex items-center justify-between px-6 py-5">
            <NuxtLink to="/"><SharedBrandMark /></NuxtLink>
            <UiButton variant="ghost" class="!px-4 !py-2 text-small" @click="goHome">
                Go home
            </UiButton>
        </div>

        <main class="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <p class="select-none font-display text-[120px] leading-none text-brand">{{ code }}</p>
            <SharedMimi :size="120" />
            <h1 class="font-display text-display-sm text-cream">{{ title }}</h1>
            <p class="max-w-md text-body text-cream-dim">{{ message }}</p>
            <div class="flex flex-wrap justify-center gap-3">
                <UiButton variant="primary" @click="goTo('/dashboard')">Browse decks</UiButton>
                <UiButton variant="ghost" @click="goTo('/')">Go home</UiButton>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode?: number; message?: string } | null }>();

const code = computed(() => props.error?.statusCode ?? 500);
const title = computed(() => (code.value === 404 ? 'You found nothing' : 'Something went wrong'));
const message = computed(() =>
    code.value === 404
        ? 'This page wandered off. Let’s get you back to your decks.'
        : (props.error?.message ?? 'An unexpected error occurred.'),
);

const goTo = (to: string) => clearError({ redirect: to });
const goHome = () => goTo('/');
</script>
