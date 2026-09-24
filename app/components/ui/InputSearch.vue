<template>
    <div :class="['relative flex items-center rounded-full', wrappers[variant]]">
        <input
            :value="modelValue"
            type="search"
            :placeholder="placeholder"
            :class="[
                'w-full rounded-full bg-transparent py-2.5 pl-5 pr-10 text-body outline-none placeholder:text-inherit',
                textColors[variant],
            ]"
            @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
        <Search :class="['absolute right-4 size-4 shrink-0', iconColors[variant]]" />
    </div>
</template>

<script setup lang="ts">
import { Search } from 'lucide-vue-next';

withDefaults(
    defineProps<{
        modelValue?: string;
        placeholder?: string;
        variant?: 'light' | 'brand' | 'dark';
    }>(),
    { modelValue: '', placeholder: 'Search...', variant: 'dark' },
);

defineEmits<{ 'update:modelValue': [value: string] }>();

// `dark` sits on a page/card surface → cream ladder (specs §Global chrome:
// bg well, border line-strong, text cream, placeholder cream-faint).
// `light` and `brand` sit on a plum/colored fill → on-plum ladder.
const wrappers = {
    light: 'bg-on-plum/10 border border-on-plum/25',
    brand: 'bg-brand border border-on-plum/25',
    dark: 'bg-bg-well text-cream border border-line-strong',
} as const;

const textColors = {
    light: 'text-on-plum placeholder:text-on-plum-faint',
    brand: 'text-on-plum placeholder:text-on-plum-faint',
    dark: 'text-cream placeholder:text-cream-faint',
} as const;

const iconColors = {
    light: 'text-on-plum-dim',
    brand: 'text-on-plum-dim',
    dark: 'text-cream-faint',
} as const;
</script>
