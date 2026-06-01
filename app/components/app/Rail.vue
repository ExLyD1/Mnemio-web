<template>
    <aside
        class="flex h-screen w-[76px] shrink-0 flex-col items-center gap-2 border-r border-line bg-bg-surface py-5"
    >
        <NuxtLink to="/dashboard" aria-label="Home" class="mb-2">
            <SharedBrandMark :with-word="false" size="sm" />
        </NuxtLink>

        <nav class="flex flex-col items-center gap-1.5">
            <UiTooltip v-for="link in navLinks" :key="link.to" :content="link.label" side="right">
                <NuxtLink
                    :to="link.to"
                    :aria-label="link.label"
                    class="grid size-11 place-items-center rounded-[13px] text-brand-muted transition-colors hover:bg-white/[0.04] hover:text-cream"
                    active-class="bg-brand text-cream"
                >
                    <component :is="link.icon" class="size-5" />
                </NuxtLink>
            </UiTooltip>
        </nav>

        <hr class="my-1 w-8 border-line" />

        <UiTooltip content="Practice" side="right">
            <NuxtLink
                to="/review"
                aria-label="Practice"
                class="grid size-11 place-items-center rounded-[13px] bg-brand/30 text-lavender transition-colors hover:bg-brand/50"
            >
                <Sparkles class="size-5" />
            </NuxtLink>
        </UiTooltip>

        <div class="mt-auto">
            <UiTooltip content="Mimi" side="right">
                <NuxtLink
                    to="/profile"
                    aria-label="Profile"
                    class="block transition-transform hover:scale-105"
                >
                    <img src="/images/mimi/axolotl.png" alt="Mimi" class="size-11 object-contain" />
                </NuxtLink>
            </UiTooltip>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { LayoutGrid, Library, Compass, BarChart3, Sparkles } from 'lucide-vue-next';

const navLinks = [
    { label: 'Home', to: '/dashboard', icon: LayoutGrid },
    { label: 'My Decks', to: '/decks', icon: Library },
    { label: 'Discover', to: '/discover', icon: Compass },
    { label: 'Statistics', to: '/statistics', icon: BarChart3 },
];
</script>
