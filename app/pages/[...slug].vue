<template>
    <section class="mx-auto flex max-w-md flex-col items-center gap-6 p-10 text-center">
        <h1 class="text-h1">404</h1>
        <p class="text-body text-brand-muted">
            We couldn't find the page you were looking for.
        </p>
        <UiButton variant="light" @click="navigateTo(home)">Go home</UiButton>
    </section>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

definePageMeta({ layout: 'default' });

const auth = useAuthStore();
const home = computed(() => (auth.isAuthenticated ? '/dashboard' : '/'));
</script>
