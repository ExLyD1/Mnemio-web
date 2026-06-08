<template>
    <kbd
        class="inline-grid min-w-[1.5rem] place-items-center rounded-md border border-line-strong bg-bg-surface dark:bg-white/[0.06] px-1.5 py-0.5 text-small font-semibold text-brand-pale"
    >
        {{ label }}
    </kbd>
</template>

<script setup lang="ts">
defineProps<{ label: string }>();
</script>
