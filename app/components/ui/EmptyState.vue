<template>
    <div class="flex flex-col items-center justify-center gap-3 rounded-2xl bg-bg-surface p-10 text-center text-brand-pale">
        <component :is="icon" v-if="icon" class="size-12 text-brand-muted" />
        <h3 v-if="title" class="text-h3 font-bold text-neutral-0">{{ title }}</h3>
        <p v-if="message" class="max-w-md text-body text-brand-muted">{{ message }}</p>
        <div v-if="$slots.action" class="mt-2">
            <slot name="action" />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
    icon?: Component;
    title?: string;
    message?: string;
}>();
</script>
