<template>
    <header
        class="flex h-[68px] shrink-0 items-center gap-4 border-b border-line bg-bg-surface/80 px-6 backdrop-blur"
    >
        <div class="flex flex-1 justify-center">
            <UiInputSearch
                v-model="search"
                :placeholder="t('topbar.search')"
                variant="dark"
                class="w-full max-w-md"
                @update:model-value="$emit('search', $event)"
            />
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
                        class="grid size-10 place-items-center rounded-full text-brand-muted transition-colors hover:bg-brand/20 hover:text-cream"
                        :aria-label="t('topbar.notifications')"
                        @click="toggle"
                    >
                        <Bell class="size-5" />
                    </button>
                </template>
                <template #default>
                    <div class="w-56 px-3 py-6 text-center">
                        <Bell class="mx-auto size-5 text-brand-muted" />
                        <p class="mt-2 text-small text-brand-muted">
                            {{ t('topbar.noNotifications') }}
                        </p>
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
                        <UiAvatar :name="displayName" :size="38" />
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
import { Bell, Plus, User, LogOut, Sun, Moon } from 'lucide-vue-next';
import { useAuth, useAuthStore, useColorMode, useToast, useT } from '#imports';

defineEmits<{ search: [value: string] }>();

const colorMode = useColorMode();
const toggleTheme = () => {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
};

const search = ref('');
const auth = useAuthStore();
const { logout } = useAuth();
const toast = useToast();
const { t } = useT();

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
