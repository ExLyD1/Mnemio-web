<template>
    <div class="flex min-h-screen items-center justify-center bg-bg-base p-6 text-brand-pale">
        <section class="flex max-w-md flex-col items-center gap-6 text-center">
            <h1 class="text-h1">{{ error?.statusCode ?? 500 }}</h1>
            <p class="text-body text-brand-muted">
                {{ error?.message ?? 'Something went wrong.' }}
            </p>
            <UiButton variant="light" @click="handleError">Go home</UiButton>
        </section>
    </div>
</template>

<script setup lang="ts">
defineProps<{ error: { statusCode?: number; message?: string } | null }>();

const handleError = () => clearError({ redirect: '/' });
</script>
