<template>
    <nav
        class="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-line bg-bg-surface/95 backdrop-blur md:hidden"
    >
        <NuxtLink
            v-for="tab in tabs"
            :key="tab.to"
            :to="tab.to"
            :aria-label="tab.label"
            class="flex flex-1 flex-col items-center gap-0.5 py-2 text-brand-muted transition-colors"
            active-class="text-cream"
        >
            <component :is="tab.icon" class="size-5" />
            <span class="text-[10px] leading-none">{{ tab.label }}</span>
        </NuxtLink>

        <!-- Mimi center tab — raised pill -->
        <NuxtLink
            to="/ai"
            :aria-label="t('rail.ai')"
            class="relative -mt-5 flex flex-col items-center"
        >
            <div
                class="flex size-14 items-center justify-center rounded-full border-4 border-bg-base bg-brand shadow-soft-elevation transition-transform hover:scale-105 active:scale-95"
            >
                <img src="/images/mimi/axolotl.png" alt="Mimi" class="size-9 object-contain" />
            </div>
            <span class="mt-1 text-[10px] leading-none text-brand-muted">{{ t('rail.ai') }}</span>
        </NuxtLink>

        <NuxtLink
            v-for="tab in tabsRight"
            :key="tab.to"
            :to="tab.to"
            :aria-label="tab.label"
            class="flex flex-1 flex-col items-center gap-0.5 py-2 text-brand-muted transition-colors"
            active-class="text-cream"
        >
            <component :is="tab.icon" class="size-5" />
            <span class="text-[10px] leading-none">{{ tab.label }}</span>
        </NuxtLink>
    </nav>
</template>

<script setup lang="ts">
import { LayoutGrid, Library, BarChart3, User } from 'lucide-vue-next';
import { useT } from '@/composables/useT';

const { t } = useT();

const tabs = computed(() => [
    { label: t('rail.home'), to: '/dashboard', icon: LayoutGrid },
    { label: t('rail.decks'), to: '/decks', icon: Library },
]);

const tabsRight = computed(() => [
    { label: t('rail.statistics'), to: '/statistics', icon: BarChart3 },
    { label: t('rail.profile'), to: '/profile', icon: User },
]);
</script>
