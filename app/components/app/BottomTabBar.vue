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
            to="/statistics"
            :aria-label="t('rail.statistics')"
            class="flex flex-1 flex-col items-center gap-0.5 py-2 text-brand-muted transition-colors"
            active-class="text-cream"
        >
            <BarChart3 class="size-5" />
            <span class="text-[10px] leading-none">{{ t('rail.statistics') }}</span>
        </NuxtLink>

        <!-- Menu button (replaces Profile tab) -->
        <button
            type="button"
            :aria-label="t('rail.menu')"
            class="flex flex-1 flex-col items-center gap-0.5 py-2 text-brand-muted transition-colors"
            @click="menuOpen = true"
        >
            <Menu class="size-5" />
            <span class="text-[10px] leading-none">{{ t('rail.menu') }}</span>
        </button>
    </nav>

    <!-- Slide-up menu sheet -->
    <Teleport to="body">
        <Transition name="sheet">
            <div
                v-if="menuOpen"
                class="fixed inset-0 z-50 md:hidden"
                @click.self="menuOpen = false"
            >
                <div
                    class="sheet-backdrop absolute inset-0 bg-black/50"
                    @click="menuOpen = false"
                />
                <div
                    class="sheet-panel absolute inset-x-0 bottom-0 rounded-t-[24px] border-t border-line bg-bg-surface pb-safe"
                >
                    <!-- Handle -->
                    <div class="flex justify-center py-3">
                        <div class="h-1 w-10 rounded-full bg-line" />
                    </div>

                    <nav class="flex flex-col px-3 pb-4">
                        <NuxtLink
                            v-for="link in menuLinks"
                            :key="link.to"
                            :to="link.to"
                            class="flex items-center gap-3 rounded-xl px-4 py-3 text-body text-cream-dim transition-colors hover:bg-brand/10 hover:text-cream"
                            active-class="text-cream"
                            @click="menuOpen = false"
                        >
                            <component :is="link.icon" class="size-5 shrink-0 text-brand-muted" />
                            {{ link.label }}
                        </NuxtLink>

                        <div class="my-2 h-px bg-line" />

                        <button
                            type="button"
                            class="flex items-center gap-3 rounded-xl px-4 py-3 text-body text-cream-dim transition-colors hover:bg-error-soft/20 hover:text-cream"
                            @click="onSignOut"
                        >
                            <LogOut class="size-5 shrink-0 text-brand-muted" />
                            {{ t('nav.signOut') }}
                        </button>
                    </nav>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import {
    LayoutGrid,
    Library,
    Compass,
    BarChart3,
    Sparkles,
    User,
    Menu,
    LogOut,
} from 'lucide-vue-next';
import { useT } from '@/composables/useT';
import { useAuth } from '@/composables/useAuth';
import { useToast } from '@/composables/useToast';

const { t } = useT();
const { logout } = useAuth();
const toast = useToast();

const menuOpen = ref(false);

const tabs = computed(() => [
    { label: t('rail.home'), to: '/dashboard', icon: LayoutGrid },
    { label: t('rail.decks'), to: '/decks', icon: Library },
]);

const menuLinks = computed(() => [
    { label: t('rail.home'), to: '/dashboard', icon: LayoutGrid },
    { label: t('rail.decks'), to: '/decks', icon: Library },
    { label: t('rail.discover'), to: '/discover', icon: Compass },
    { label: t('rail.statistics'), to: '/statistics', icon: BarChart3 },
    { label: t('rail.practice'), to: '/review', icon: Sparkles },
    { label: t('rail.profile'), to: '/profile', icon: User },
]);

const onSignOut = async () => {
    menuOpen.value = false;
    await logout.execute();
    toast.success(t('auth.signedOut'));
    await navigateTo('/login');
};
</script>

<style scoped>
.sheet-enter-active .sheet-panel,
.sheet-leave-active .sheet-panel {
    transition: transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel {
    transform: translateY(100%);
}
.sheet-enter-active .sheet-backdrop,
.sheet-leave-active .sheet-backdrop {
    transition: opacity 0.28s ease;
}
.sheet-enter-from .sheet-backdrop,
.sheet-leave-to .sheet-backdrop {
    opacity: 0;
}
</style>
