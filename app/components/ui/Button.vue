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
        variant?: 'primary' | 'ghost' | 'light' | 'text';
        disabled?: boolean;
    }>(),
    { variant: 'primary', disabled: false },
);

const variants = {
    primary:
        'bg-lavender text-plum-deep shadow-lavender-cta hover:bg-lavender hover:-translate-y-px transition-transform',
    ghost:
        'bg-transparent text-cream border border-line-strong hover:border-cream-dim hover:bg-white/[0.03]',
    light:   'bg-brand-light text-brand hover:bg-brand-pale',
    text:    'text-brand-pale hover:text-brand-light',
} as const;
</script>
