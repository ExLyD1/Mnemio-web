<template>
    <span
        :class="[
            'inline-block animate-spin rounded-full border-2 border-current border-r-transparent align-[-0.125em]',
            sizes[size],
        ]"
        role="status"
        aria-label="Loading"
    />
</template>

<script setup lang="ts">
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' });

const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
} as const;
</script>
