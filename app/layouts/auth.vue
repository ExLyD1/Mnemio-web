<template>
    <div class="relative min-h-screen bg-bg-base bg-page-glow text-cream">
        <div class="absolute right-6 top-6 flex items-center gap-3">
            <SharedLanguageSwitcher variant="menu" />
            <NuxtLink to="/" class="text-small text-brand-muted transition-colors hover:text-cream">
                {{ t('nav.exit') }}
            </NuxtLink>
        </div>
        <div class="flex min-h-screen w-full items-center justify-center px-4 py-16">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useT } from '#imports';

const { t } = useT();
</script>
