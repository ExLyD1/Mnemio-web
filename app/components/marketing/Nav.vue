<template>
    <nav class="sticky top-0 z-50 border-b border-line bg-bg-base/70 backdrop-blur">
        <div class="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-4">
            <NuxtLink to="/"><SharedBrandMark /></NuxtLink>

            <div class="hidden gap-7 text-small md:flex">
                <NuxtLink
                    v-for="l in links"
                    :key="l.key"
                    :to="l.to"
                    :class="[
                        'transition-colors',
                        current === l.key ? 'text-cream' : 'text-brand-muted hover:text-cream',
                    ]"
                >
                    {{ l.label }}
                </NuxtLink>
            </div>

            <div class="flex items-center gap-2.5">
                <UiButton
                    v-if="auth.isAuthenticated"
                    variant="primary"
                    class="!px-4 !py-2 text-small"
                    @click="navigateTo('/dashboard')"
                >
                    Open app
                </UiButton>
                <template v-else>
                    <UiButton
                        variant="ghost"
                        class="!px-3.5 !py-2 text-small"
                        @click="navigateTo('/login?tab=login')"
                    >
                        Sign in
                    </UiButton>
                    <UiButton
                        variant="primary"
                        class="!px-4 !py-2 text-small"
                        @click="navigateTo('/login?tab=register')"
                    >
                        Get started
                    </UiButton>
                </template>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '#imports';

withDefaults(defineProps<{ current?: string }>(), { current: '' });

const auth = useAuthStore();

const links = [
    { key: 'about', label: 'About', to: '/about' },
    { key: 'blog', label: 'Blog', to: '/blog' },
    { key: 'features', label: 'Features', to: '/#features' },
];
</script>
