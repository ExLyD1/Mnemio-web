<template>
    <button
        :class="[
            'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-body font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40',
            variants[variant],
        ]"
        :disabled="disabled"
        v-bind="$attrs"
    >
        <slot />
    </button>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

withDefaults(
    defineProps<{
        variant?: 'primary' | 'ghost' | 'light' | 'text' | 'on-cover' | 'on-cover-ghost';
        disabled?: boolean;
    }>(),
    { variant: 'primary', disabled: false },
);

const variants = {
    primary: 'bg-brand text-on-color hover:bg-brand-bright hover:shadow-md hover:shadow-brand/20',
    ghost: 'bg-transparent text-cream border border-line-strong hover:border-cream-dim hover:bg-brand/15',
    // A light pill in BOTH themes (on-plum is light in dark mode and white in
    // light mode), so its ink is plum. `bg-brand-light` was the cream token,
    // which is dark ink in light mode and rendered as a dark slab.
    light: 'bg-on-plum text-plum hover:bg-on-plum-dim',
    text: 'text-brand-pale hover:text-brand-light',
    // Safe for use on any deck cover gradient (always dark/saturated)
    'on-cover': 'bg-on-plum/90 text-plum-deep hover:bg-on-plum shadow-sm',
    'on-cover-ghost': 'bg-transparent text-on-color border border-on-plum/50 hover:bg-on-plum/10',
} as const;
</script>
