<template>
    <component :is="as" class="inline-flex items-center">
        <template v-if="withWord">
            <img
                src="/images/brand/mnemio-logo-green-dark.svg"
                alt="Mnemio"
                :class="[sizes[size].logo, 'hidden dark:block']"
            />
            <img
                src="/images/brand/mnemio-logo-green-light.svg"
                alt="Mnemio"
                :class="[sizes[size].logo, 'dark:hidden']"
            />
        </template>
        <template v-else>
            <img
                src="/images/brand/mnemio-icon-green-dark.svg"
                alt="Mnemio"
                :class="[sizes[size].icon, 'hidden dark:block']"
            />
            <img
                src="/images/brand/mnemio-icon-green-light.svg"
                alt="Mnemio"
                :class="[sizes[size].icon, 'dark:hidden']"
            />
        </template>
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
    sm: { logo: 'h-8 w-auto', icon: 'size-8' },
    md: { logo: 'h-10 w-auto', icon: 'size-9' },
} as const;
</script>
