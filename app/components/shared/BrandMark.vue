<template>
    <component :is="as" class="inline-flex items-center gap-3">
        <img src="/images/logo.svg" alt="Mnemio" :class="[sizes[size].tile, 'rounded-[10px]']" />
        <span v-if="withWord" :class="[sizes[size].word, 'font-display text-cream']">Mnemio</span>
    </component>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        size?: 'sm' | 'md';
        withWord?: boolean;
        as?: string;
    }>(),
    { size: 'md', withWord: true, as: 'span' },
);

const sizes = {
    sm: { tile: 'size-8', word: 'text-lg' },
    md: { tile: 'size-9', word: 'text-[19px]' },
} as const;
</script>
