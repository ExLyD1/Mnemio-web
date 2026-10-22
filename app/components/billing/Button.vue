<template>
    <button
        type="button"
        :disabled="disabled || busy"
        :aria-busy="busy"
        :class="[
            'relative inline-flex min-h-11 items-center justify-center rounded-[14px] px-6 py-3.5 text-body font-bold transition-colors focus-visible:outline-none focus-visible:shadow-focus-ring disabled:cursor-not-allowed disabled:opacity-50',
            kind === 'primary'
                ? 'bg-purple text-on-accent hover:brightness-105'
                : kind === 'ghost'
                  ? 'border border-line-strong text-cream hover:bg-bg-surface-2'
                  : kind === 'danger'
                    ? 'text-error-soft hover:bg-bg-surface-2'
                    : 'text-cream-dim hover:bg-bg-surface-2',
        ]"
    >
        <span :class="busy ? 'opacity-0' : ''"><slot /></span>
        <UiSpinner v-if="busy" size="sm" class="absolute" />
    </button>
</template>
<script setup lang="ts">
withDefaults(
    defineProps<{
        kind?: 'primary' | 'ghost' | 'text' | 'danger';
        busy?: boolean;
        disabled?: boolean;
    }>(),
    { kind: 'primary', busy: false, disabled: false },
);
</script>
