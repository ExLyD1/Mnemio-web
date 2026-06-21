<template>
    <nav class="sticky top-0 z-50 border-b border-line bg-bg-base/70 backdrop-blur">
        <div class="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-4">
            <NuxtLink to="/"><SharedBrandMark /></NuxtLink>

            <div v-if="!auth.isAuthenticated" class="hidden gap-7 text-small md:flex">
                <NuxtLink
                    v-for="l in links"
                    :key="l.key"
                    :to="l.to"
                    :class="[
                        'transition-colors',
                        current === l.key ? 'text-cream' : 'text-brand-muted hover:text-cream',
                    ]"
                >
                    {{ t(l.label) }}
                </NuxtLink>
            </div>

            <div class="flex items-center gap-2.5">
                <div class="hidden sm:block">
                    <SharedLanguageSwitcher variant="menu" />
                </div>
                <UiButton
                    v-if="auth.isAuthenticated"
                    variant="primary"
                    class="!px-4 !py-2 text-small"
                    @click="navigateTo('/dashboard')"
                >
                    {{ t('nav.openApp') }}
                </UiButton>
                <template v-else>
                    <UiButton
                        variant="ghost"
                        class="!px-3.5 !py-2 text-small"
                        @click="navigateTo('/login?tab=login')"
                    >
                        {{ t('nav.signIn') }}
                    </UiButton>
                    <UiButton
                        variant="primary"
                        class="!px-4 !py-2 text-small"
                        @click="navigateTo('/login?tab=register')"
                    >
                        {{ t('nav.getStarted') }}
                    </UiButton>
                </template>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { useAuthStore, useT } from '#imports';

withDefaults(defineProps<{ current?: string }>(), { current: '' });

const auth = useAuthStore();
const { t } = useT();

const links = [
    { key: 'about', label: 'nav.about', to: '/about' },
    { key: 'blog', label: 'nav.blog', to: '/blog' },
    { key: 'features', label: 'nav.features', to: '/#features' },
];
</script>
