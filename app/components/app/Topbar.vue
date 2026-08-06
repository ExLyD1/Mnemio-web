<template>
    <header
        class="flex h-[68px] shrink-0 items-center gap-4 border-b border-line bg-bg-surface/80 px-6 backdrop-blur"
    >
        <div class="flex flex-1 justify-center">
            <div
                class="relative w-full max-w-md"
                @focusin="searchFocused = true"
                @focusout="onSearchBlur"
            >
                <UiInputSearch
                    v-model="search"
                    :placeholder="t('topbar.search')"
                    variant="dark"
                    class="w-full"
                    @keydown.enter="goToDiscover"
                />
                <div
                    v-if="showSuggestions"
                    class="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line-strong bg-bg-surface p-1.5 shadow-soft-elevation"
                >
                    <NuxtLink
                        v-for="d in suggestions"
                        :key="d.id"
                        :to="`/decks/${d.id}`"
                        class="flex items-center gap-3 rounded-xl px-3 py-2 text-body text-brand-pale transition-colors hover:bg-brand/20"
                        @click="closeSearch"
                    >
                        <span class="min-w-0 flex-1 truncate">{{ d.title }}</span>
                        <span class="shrink-0 text-small text-brand-muted">
                            {{ t('deck.cardCount').replace('{n}', String(d.cardCount)) }}
                        </span>
                    </NuxtLink>
                    <p v-if="!suggestions.length" class="px-3 py-2 text-small text-brand-muted">
                        {{ t('topbar.searchNoMatches').replace('{q}', search.trim()) }}
                    </p>
                    <button
                        type="button"
                        class="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border-t border-line px-3 py-2 text-small text-lavender transition-colors hover:bg-brand/20"
                        @click="goToDiscover"
                    >
                        {{ t('topbar.searchSeeAll') }}
                    </button>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-2">
            <button
                type="button"
                class="grid size-10 place-items-center rounded-full text-brand-muted transition-colors hover:bg-brand/20 hover:text-cream"
                :aria-label="t('topbar.toggleTheme')"
                @click="toggleTheme"
            >
                <Moon v-if="colorMode.value === 'dark'" class="size-5" />
                <Sun v-else class="size-5" />
            </button>

            <UiPopover align="right">
                <template #trigger="{ toggle }">
                    <button
                        type="button"
                        class="relative grid size-10 place-items-center rounded-full text-brand-muted transition-colors hover:bg-brand/20 hover:text-cream"
                        :aria-label="t('topbar.notifications')"
                        @click="toggle"
                    >
                        <Bell class="size-5" />
                        <span
                            v-if="unseenAchievements.length > 0"
                            class="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-bg-surface bg-lavender px-1 text-[10px] font-bold text-plum-deep"
                        >
                            {{ unseenAchievements.length > 9 ? '9+' : unseenAchievements.length }}
                        </span>
                    </button>
                </template>
                <template #default="{ close }">
                    <div v-if="unseenAchievements.length === 0" class="w-64 px-3 py-6 text-center">
                        <Bell class="mx-auto size-5 text-brand-muted" />
                        <p class="mt-2 text-small text-brand-muted">
                            {{ t('topbar.noNotifications') }}
                        </p>
                    </div>
                    <div v-else class="w-72">
                        <button
                            v-for="a in unseenAchievements"
                            :key="a.key"
                            type="button"
                            class="flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-brand/20"
                            @click="onNotificationClick(a, close)"
                        >
                            <Trophy class="mt-0.5 size-4 shrink-0 text-lavender" />
                            <span class="min-w-0 flex-1">
                                <span class="block truncate text-body text-brand-pale">
                                    {{ t(`achievements.${a.key}.name`, a.name) }}
                                </span>
                                <span class="block text-small text-brand-muted">
                                    {{ t('topbar.achievementUnlocked') }}
                                </span>
                            </span>
                        </button>
                        <button
                            type="button"
                            class="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border-t border-line px-3 py-2 text-small text-lavender transition-colors hover:bg-brand/20"
                            @click="onViewAll(close)"
                        >
                            {{ t('topbar.viewAchievements') }}
                        </button>
                    </div>
                </template>
            </UiPopover>

            <UiButton
                variant="primary"
                class="hidden sm:inline-flex"
                @click="navigateTo('/decks/create')"
            >
                <Plus class="size-4" />
                {{ t('topbar.newDeck') }}
            </UiButton>

            <UiPopover align="right">
                <template #trigger="{ toggle }">
                    <button
                        type="button"
                        class="rounded-full transition-transform hover:scale-105"
                        :aria-label="t('topbar.account')"
                        @click="toggle"
                    >
                        <UiAvatar
                            :name="displayName"
                            :src="mediaUrl(auth.currentUser?.avatarUrl)"
                            :size="38"
                        />
                    </button>
                </template>
                <template #default="{ close }">
                    <NuxtLink
                        to="/profile"
                        class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-body text-brand-pale transition-colors hover:bg-brand/20"
                        @click="close"
                    >
                        <User class="size-4" />
                        {{ t('topbar.profile') }}
                    </NuxtLink>
                    <SharedLanguageSwitcher variant="menu" />
                    <button
                        type="button"
                        class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-body text-brand-pale transition-colors hover:bg-brand/20 disabled:opacity-40"
                        @click="() => onLogout(close)"
                    >
                        <LogOut class="size-4" />
                        {{ t('nav.signOut') }}
                    </button>
                </template>
            </UiPopover>
        </div>
    </header>
</template>

<script setup lang="ts">
import { Bell, Plus, User, LogOut, Sun, Moon, Trophy } from 'lucide-vue-next';
import { useAuth, useAuthStore, useColorMode, useDecks, useToast, useT } from '#imports';
import { useAchievementNotifications } from '@/composables/useAchievementNotifications';
import { mediaUrl } from '@/utils/media';
import type { Achievement } from '@/types/achievement';

const colorMode = useColorMode();
const toggleTheme = () => {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};

const search = ref('');
const searchFocused = ref(false);
const auth = useAuthStore();
const { store, fetchList } = useDecks();
const { logout } = useAuth();
const toast = useToast();
const { t } = useT();
const notifications = useAchievementNotifications();
const unseenAchievements = notifications.unseen;

const onNotificationClick = async (a: Achievement, close: () => void) => {
    close();
    await notifications.ack([a.key]);
    await navigateTo('/profile?tab=achievements');
};

const onViewAll = async (close: () => void) => {
    close();
    await notifications.ack();
    await navigateTo('/profile?tab=achievements');
};

// Quick matches against the user's own decks; the full search lives on /discover.
const suggestions = computed(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) {
        return [];
    }
    return store.summaries.filter((d) => d.title.toLowerCase().includes(q)).slice(0, 4);
});
const showSuggestions = computed(() => searchFocused.value && search.value.trim().length > 0);

const closeSearch = () => {
    searchFocused.value = false;
};

const onSearchBlur = (e: FocusEvent) => {
    // Keep the panel open while focus moves within the search container.
    const next = e.relatedTarget as Node | null;
    const container = e.currentTarget as HTMLElement;
    if (!next || !container.contains(next)) {
        searchFocused.value = false;
    }
};

const goToDiscover = () => {
    const q = search.value.trim();
    searchFocused.value = false;
    navigateTo(q ? `/discover?q=${encodeURIComponent(q)}` : '/discover');
};

onMounted(() => {
    if (!store.summaries.length) {
        fetchList.execute({ cursor: null, append: false });
    }
});

const displayName = computed(
    () => auth.currentUser?.displayName ?? auth.currentUser?.username ?? '',
);

const onLogout = async (close: () => void) => {
    close();
    await logout.execute();
    toast.success(t('auth.signedOut'));
    await navigateTo('/login');
};
</script>
