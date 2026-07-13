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
    light: 'bg-brand-light text-brand hover:bg-brand-pale',
    text: 'text-brand-pale hover:text-brand-light',
    // Safe for use on any deck cover gradient (always dark/saturated)
    'on-cover': 'bg-white/90 text-[#1a0d2e] hover:bg-white shadow-sm',
    'on-cover-ghost': 'bg-transparent text-on-color border border-white/50 hover:bg-white/10',
} as const;
</script>
