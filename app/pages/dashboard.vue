<template>
    <section class="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <h1 class="text-h1">Welcome back{{ greetingName ? `, ${greetingName}` : '' }} 👋</h1>
        <p class="text-body text-brand-muted">
            You don't have any decks yet. Create your first one to start learning.
        </p>
        <div>
            <UiButton variant="light" @click="navigateTo('/decks/create')">
                Create your first deck
            </UiButton>
        </div>
    </section>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

definePageMeta({ layout: 'default' });

const auth = useAuthStore();
const greetingName = computed(() => auth.currentUser?.displayName ?? null);
</script>
