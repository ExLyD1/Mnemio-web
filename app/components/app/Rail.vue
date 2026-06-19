<template>
    <aside
        class="relative h-screen w-[76px] shrink-0"
        @mouseenter="expanded = true"
        @mouseleave="expanded = false"
    >
        <!--
          Absolute overlay so expanding to 240px never reflowing page content.
          The outer <aside> always occupies 76px in the flex layout.
          Items are always items-stretch + fixed padding so icons never shift position.
          Text labels fade in/out with opacity so no layout changes during the width animation.
        -->
        <div
            class="absolute inset-y-0 left-0 z-50 flex flex-col items-stretch overflow-hidden border-r border-line bg-bg-surface px-3.5 py-[18px] transition-[width,box-shadow] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            :class="
                expanded ? 'w-[240px] shadow-[8px_0_40px_-8px_rgba(0,0,0,0.6)]' : 'w-[76px]'
            "
        >
            <!-- Brand -->
            <NuxtLink
                to="/dashboard"
                :aria-label="t('rail.home')"
                class="mb-3.5 flex min-h-[30px] items-center gap-2.5 px-[13px]"
            >
                <SharedBrandMark :with-word="false" size="sm" class="shrink-0" />
                <span
                    class="whitespace-nowrap font-display text-[22px] text-cream transition-opacity duration-[160ms]"
                    :class="expanded ? 'opacity-100 delay-[100ms]' : 'opacity-0 delay-0'"
                    >Mnemio</span
                >
            </NuxtLink>

            <!-- Nav links -->
            <nav class="flex flex-col gap-1.5">
                <UiTooltip
                    v-for="link in navLinks"
                    :key="link.to"
                    :content="expanded ? '' : link.label"
                    side="right"
                >
                    <NuxtLink
                        :to="link.to"
                        :aria-label="link.label"
                        :class="[
                            'flex h-11 w-full items-center gap-3.5 rounded-[13px] px-3 transition-colors',
                            isActive(link.to)
                                ? 'bg-brand text-on-color'
                                : 'text-cream-faint hover:bg-brand/20 hover:text-cream',
                        ]"
                    >
                        <component
                            :is="link.icon"
                            class="size-5 shrink-0"
                            :class="isActive(link.to) ? 'text-pink-soft' : ''"
                        />
                        <span
                            class="flex-1 whitespace-nowrap text-sm font-semibold leading-none text-cream transition-opacity duration-[160ms]"
                            :class="expanded ? 'opacity-100 delay-[100ms]' : 'opacity-0 delay-0'"
                        >
                            {{ link.label }}
                        </span>
                        <!-- Due badge on Dashboard link -->
                        <span
                            v-if="link.to === '/dashboard' && dueCount > 0"
                            class="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-lavender px-1 text-[10px] font-bold text-plum-deep transition-opacity duration-[160ms]"
                            :class="expanded ? 'opacity-100 delay-[100ms]' : 'opacity-0 delay-0'"
                        >
                            {{ dueCount > 99 ? '99+' : dueCount }}
                        </span>
                    </NuxtLink>
                </UiTooltip>
            </nav>

            <hr class="my-2.5 w-full border-line" />

            <!-- Review (SRS) -->
            <UiTooltip :content="expanded ? '' : t('rail.practice')" side="right">
                <NuxtLink
                    to="/review"
                    :aria-label="t('rail.practice')"
                    class="flex h-11 w-full items-center gap-3.5 rounded-[13px] bg-brand/30 px-3 text-lavender transition-colors hover:bg-brand/50"
                >
                    <span class="relative shrink-0">
                        <Sparkles class="size-5" />
                        <span
                            v-if="dueCount > 0"
                            class="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-bg-surface bg-lavender px-1 text-[10px] font-bold text-plum-deep"
                        >
                            {{ dueCount > 99 ? '99+' : dueCount }}
                        </span>
                    </span>
                    <span
                        class="whitespace-nowrap text-sm font-semibold leading-none text-lavender transition-opacity duration-[160ms]"
                        :class="expanded ? 'opacity-100 delay-[100ms]' : 'opacity-0 delay-0'"
                    >
                        {{ t('rail.practice') }}
                    </span>
                </NuxtLink>
            </UiTooltip>

            <!-- Library group (expanded only) -->
            <template v-if="expanded && libraryDecks.length">
                <p
                    class="mt-3 px-3 pb-2 text-[11px] font-semibold uppercase tracking-[.18em] text-cream-faint"
                >
                    {{ t('deck.libraryEyebrow') }}
                </p>
                <NuxtLink
                    v-for="deck in libraryDecks"
                    :key="deck.id"
                    :to="`/decks/${deck.id}`"
                    class="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-brand/15"
                >
                    <span class="size-1.5 shrink-0 rounded-full bg-lavender" />
                    <span class="min-w-0 flex-1 truncate text-[13px] text-cream-dim">
                        {{ deck.title }}
                    </span>
                    <span class="text-[11px] text-cream-faint">{{ deck.masteredPct }}%</span>
                </NuxtLink>
            </template>

            <!-- Mimi — bottom anchor -->
            <div class="mt-auto">
                <UiTooltip :content="expanded ? '' : 'Mimi'" side="right">
                    <NuxtLink
                        to="/profile"
                        :aria-label="t('rail.profile')"
                        class="flex w-full items-center gap-3 rounded-[13px] px-0 transition-transform hover:scale-105"
                        :class="expanded ? 'h-[54px]' : 'h-11'"
                    >
                        <span class="grid w-11 shrink-0 place-items-center">
                            <img
                                src="/images/mimi/axolotl.png"
                                alt="Mimi"
                                class="size-10 object-contain"
                                style="filter: drop-shadow(0 4px 8px rgba(169, 142, 227, 0.4))"
                            />
                        </span>
                        <div
                            class="whitespace-nowrap transition-opacity duration-[160ms]"
                            :class="expanded ? 'opacity-100 delay-[100ms]' : 'opacity-0 delay-0'"
                        >
                            <p class="text-[13px] font-bold leading-tight text-cream">Mimi</p>
                            <p class="text-[11px] text-cream-dim">{{ t('rail.profile') }}</p>
                        </div>
                    </NuxtLink>
                </UiTooltip>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { LayoutGrid, Library, Compass, BarChart3, Bot, Sparkles } from 'lucide-vue-next';
import { useT } from '@/composables/useT';
import { useSrsStore } from '@/stores/srs';
import { useDecksStore } from '@/stores/decks';

const { t } = useT();
const srs = useSrsStore();
const decksStore = useDecksStore();
const route = useRoute();
const expanded = ref(false);

const dueCount = computed(() => srs.dueCount);

const navLinks = computed(() => [
    { label: t('rail.home'), to: '/dashboard', icon: LayoutGrid },
    { label: t('rail.decks'), to: '/decks', icon: Library },
    { label: t('rail.discover'), to: '/discover', icon: Compass },
    { label: t('rail.statistics'), to: '/statistics', icon: BarChart3 },
    { label: t('rail.ai'), to: '/ai', icon: Bot },
]);

const isActive = (to: string) =>
    to === '/dashboard' ? route.path === to : route.path === to || route.path.startsWith(to + '/');

const libraryDecks = computed(() =>
    [...decksStore.summaries]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3)
        .map((d) => ({ id: d.id, title: d.title, masteredPct: d.stats.masteredPct })),
);
</script>
