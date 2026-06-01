<template>
    <component :is="as" class="inline-flex items-center gap-3">
        <span
            :class="[
                sizes[size].tile,
                'grid place-items-center rounded-[10px] bg-brand font-display italic leading-none text-cream shadow-[inset_0_1px_0_rgba(255,255,255,0.09)]',
            ]"
        >
            M
        </span>
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
    sm: { tile: 'size-8 text-lg', word: 'text-lg' },
    md: { tile: 'size-9 text-xl', word: 'text-[19px]' },
} as const;
</script>
