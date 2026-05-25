<template>
    <span
        :class="[
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-small font-semibold',
            variants[variant],
        ]"
    >
        <slot />
    </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'neutral' | 'brand' | 'accent' | 'error' }>(), {
    variant: 'neutral',
});

const variants = {
    neutral: 'bg-bg-muted text-brand-pale',
    brand: 'bg-brand text-neutral-0',
    accent: 'bg-accent text-neutral-0',
    error: 'bg-error text-neutral-0',
} as const;
</script>
