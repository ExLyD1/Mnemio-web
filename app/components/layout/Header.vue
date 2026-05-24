<template>
    <header class="bg-brand px-6 py-3 lg:px-10">
        <div class="mx-auto flex max-w-screen-xl items-center gap-4">
            <NuxtLink :to="homeLink" class="shrink-0">
                <img src="/images/logo.svg" alt="Mnemio" class="h-8" />
            </NuxtLink>

            <div class="hidden flex-1 justify-center md:flex">
                <UiInputSearch
                    v-model="search"
                    placeholder="Enter keyword to search"
                    variant="light"
                    class="w-full max-w-md"
                />
            </div>

            <div class="ml-auto flex items-center gap-2">
                <template v-if="auth.isAuthenticated">
                    <UiButton variant="text" class="hidden sm:inline-flex" @click="navigateTo('/dashboard')">
                        Dashboard
                    </UiButton>
                    <UiButton variant="ghost" :disabled="logout.loading.value" @click="onLogout">
                        <UiSpinner v-if="logout.loading.value" size="sm" class="mr-2" />
                        Sign out
                    </UiButton>
                </template>
                <template v-else>
                    <UiButton variant="text" class="hidden sm:inline-flex" @click="navigateTo('/login?tab=login')">
                        Login
                    </UiButton>
                    <UiButton variant="ghost" @click="navigateTo('/login?tab=register')">
                        Register
                    </UiButton>
                </template>
            </div>
        </div>

        <div class="mt-3 md:hidden">
            <UiInputSearch
                v-model="search"
                placeholder="Enter keyword to search"
                variant="light"
                class="w-full"
            />
        </div>
    </header>
</template>

<script setup lang="ts">
import { useAuth, useAuthStore, useToast } from '#imports';

const search = ref('');
const auth = useAuthStore();
const { logout } = useAuth();
const toast = useToast();

const homeLink = computed(() => (auth.isAuthenticated ? '/dashboard' : '/'));

const onLogout = async () => {
    await logout.execute();
    toast.success('You have been signed out');
    await navigateTo('/login');
};
</script>
