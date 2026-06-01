<template>
    <header
        class="flex h-[68px] shrink-0 items-center gap-4 border-b border-line bg-bg-base/80 px-6 backdrop-blur"
    >
        <div class="flex flex-1 justify-center">
            <UiInputSearch
                v-model="search"
                placeholder="Search decks…"
                variant="dark"
                class="w-full max-w-md"
                @update:model-value="$emit('search', $event)"
            />
        </div>

        <div class="flex items-center gap-2">
            <button
                type="button"
                class="relative grid size-10 place-items-center rounded-full text-brand-muted transition-colors hover:bg-white/[0.04] hover:text-cream"
                aria-label="Notifications"
            >
                <Bell class="size-5" />
                <span class="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-pink-soft" />
            </button>

            <UiButton
                variant="primary"
                class="hidden sm:inline-flex"
                @click="navigateTo('/decks/create')"
            >
                <Plus class="size-4" />
                New deck
            </UiButton>

            <UiPopover align="right">
                <template #trigger="{ toggle }">
                    <button
                        type="button"
                        class="rounded-full transition-transform hover:scale-105"
                        aria-label="Account"
                        @click="toggle"
                    >
                        <UiAvatar :name="displayName" :size="38" />
                    </button>
                </template>
                <template #default="{ close }">
                    <NuxtLink
                        to="/profile"
                        class="flex items-center gap-2.5 rounded-xl px-3 py-2 text-body text-brand-pale transition-colors hover:bg-white/[0.04]"
                        @click="close"
                    >
                        <User class="size-4" />
                        Profile
                    </NuxtLink>
                    <button
                        type="button"
                        class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-body text-brand-pale transition-colors hover:bg-white/[0.04] disabled:opacity-40"
                        @click="() => onLogout(close)"
                    >
                        <LogOut class="size-4" />
                        Sign out
                    </button>
                </template>
            </UiPopover>
        </div>
    </header>
</template>

<script setup lang="ts">
import { Bell, Plus, User, LogOut } from 'lucide-vue-next';
import { useAuth, useAuthStore, useToast } from '#imports';

defineEmits<{ search: [value: string] }>();

const search = ref('');
const auth = useAuthStore();
const { logout } = useAuth();
const toast = useToast();

const displayName = computed(
    () => auth.currentUser?.displayName ?? auth.currentUser?.username ?? '',
);

const onLogout = async (close: () => void) => {
    close();
    await logout.execute();
    toast.success('You have been signed out');
    await navigateTo('/login');
};
</script>
