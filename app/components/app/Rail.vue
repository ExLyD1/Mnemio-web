<template>
    <aside
        class="flex h-screen w-[76px] shrink-0 flex-col items-center gap-2 border-r border-line bg-bg-surface py-5"
    >
        <NuxtLink to="/dashboard" :aria-label="t('rail.home')" class="mb-2">
            <SharedBrandMark :with-word="false" size="sm" />
        </NuxtLink>

        <nav class="flex flex-col items-center gap-1.5">
            <UiTooltip v-for="link in navLinks" :key="link.to" :content="link.label" side="right">
                <NuxtLink
                    :to="link.to"
                    :aria-label="link.label"
                    class="grid size-11 place-items-center rounded-[13px] text-brand-muted transition-colors hover:bg-brand/20 hover:text-cream"
                    active-class="bg-brand text-on-color"
                >
                    <component :is="link.icon" class="size-5" />
                </NuxtLink>
            </UiTooltip>
        </nav>

        <hr class="my-1 w-8 border-line" />

        <UiTooltip :content="t('rail.practice')" side="right">
            <NuxtLink
                to="/review"
                :aria-label="t('rail.practice')"
                class="relative grid size-11 place-items-center rounded-[13px] bg-brand/30 text-lavender transition-colors hover:bg-brand/50"
            >
                <Sparkles class="size-5" />
                <span
                    v-if="dueCount > 0"
                    class="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-lavender px-1 text-[10px] font-bold text-plum-deep"
                >
                    {{ dueCount > 99 ? '99+' : dueCount }}
                </span>
            </NuxtLink>
        </UiTooltip>

        <div class="mt-auto">
            <UiTooltip content="Mimi" side="right">
                <NuxtLink
                    to="/profile"
                    :aria-label="t('rail.profile')"
                    class="block transition-transform hover:scale-105"
                >
                    <img src="/images/mimi/axolotl.png" alt="Mimi" class="size-11 object-contain" />
                </NuxtLink>
            </UiTooltip>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { LayoutGrid, Library, Compass, BarChart3, Sparkles, Bot } from 'lucide-vue-next';
import { useT } from '@/composables/useT';
import { useSrsStore } from '@/stores/srs';

const { t } = useT();
const srs = useSrsStore();
const dueCount = computed(() => srs.dueCount);

const navLinks = computed(() => [
    { label: t('rail.home'), to: '/dashboard', icon: LayoutGrid },
    { label: t('rail.decks'), to: '/decks', icon: Library },
    { label: t('rail.discover'), to: '/discover', icon: Compass },
    { label: t('rail.statistics'), to: '/statistics', icon: BarChart3 },
    { label: t('rail.ai'), to: '/ai', icon: Bot },
]);
</script>
