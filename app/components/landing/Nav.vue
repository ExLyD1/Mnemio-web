<template>
    <nav class="sticky top-0 z-50 border-b border-line bg-bg-landing/60 backdrop-blur">
        <div class="mx-auto flex max-w-[1240px] items-center justify-between px-8 py-4">
            <NuxtLink to="/" class="flex items-center gap-2.5">
                <span
                    class="grid size-7 place-items-center rounded-lg bg-plum-card-back text-pink-soft"
                >
                    <Sparkles class="size-3.5" />
                </span>
                <span class="font-display text-[22px] tracking-tight text-cream">Mnemio</span>
            </NuxtLink>

            <div class="hidden gap-7 text-small text-cream-dim md:flex">
                <a
                    v-for="link in links"
                    :key="link.label"
                    :href="link.href"
                    class="transition-colors hover:text-cream"
                >
                    {{ link.label }}
                </a>
            </div>

            <div class="flex items-center gap-2.5">
                <template v-if="auth.isAuthenticated">
                    <UiButton variant="primary" @click="navigateTo('/dashboard')">
                        Open app
                    </UiButton>
                </template>
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
import { Sparkles } from 'lucide-vue-next';
import { useAuthStore } from '#imports';

const auth = useAuthStore();

const links = [
    { label: 'How it works', href: '#how' },
    { label: 'Features', href: '#features' },
    { label: 'AI companion', href: '#ai' },
    { label: 'Try a card', href: '#demo' },
];
</script>
