<template>
    <span
        :class="[
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-small font-semibold',
            tones[tone],
        ]"
    >
        <slot />
    </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'muted' | 'plum' | 'due' | 'accent' | 'success' }>(), {
    tone: 'muted',
});

const tones = {
    muted: 'border-line-strong text-brand-muted',
    plum: 'border-brand-bright/45 bg-brand/30 text-brand-pale',
    due: 'border-pink-soft/40 text-pink-soft',
    accent: 'border-accent/40 text-accent-light',
    success: 'border-success/40 text-success-bright',
} as const;
</script>
