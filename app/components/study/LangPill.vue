<template>
    <span
        class="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-2.5 py-1 text-small font-semibold text-brand-pale"
    >
        <span class="size-2 rounded-full bg-lavender" />
        {{ lang }}
        <span v-if="region" class="text-brand-muted">· {{ region }}</span>
    </span>
</template>

<script setup lang="ts">
defineProps<{ lang: string; region?: string }>();
</script>
