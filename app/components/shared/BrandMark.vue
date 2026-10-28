<template>
    <component :is="as" class="inline-flex items-center">
        <img
            :src="src('dark')"
            alt="Mnemio"
            :class="[withWord ? sizes[size].logo : sizes[size].icon, 'hidden dark:block']"
        />
        <img
            :src="src('light')"
            alt="Mnemio"
            :class="[withWord ? sizes[size].logo : sizes[size].icon, 'dark:hidden']"
        />
    </component>
</template>

<script setup lang="ts">
import { useAppearanceStore } from '@/stores/appearance';

const props = withDefaults(
    defineProps<{
        size?: 'sm' | 'md';
        withWord?: boolean;
        as?: string;
    }>(),
    { size: 'md', withWord: true, as: 'span' },
);

const appearance = useAppearanceStore();
// The logo follows the colour palette (public/images/brand/mnemio-{logo,icon}-{palette}-{theme}.svg).
const src = (theme: 'dark' | 'light') =>
    `/images/brand/mnemio-${props.withWord ? 'logo' : 'icon'}-${appearance.palette}-${theme}.svg`;

const sizes = {
    sm: { logo: 'h-8 w-auto', icon: 'size-8' },
    md: { logo: 'h-10 w-auto', icon: 'size-9' },
} as const;
</script>
