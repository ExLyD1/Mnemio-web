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

const wrappers = {
    light: 'bg-brand-light text-brand',
    brand: 'bg-brand text-brand-pale',
    dark: 'bg-bg-surface text-brand-muted',
} as const;

const textColors = {
    light: 'text-brand placeholder:opacity-60',
    brand: 'text-brand-pale placeholder:opacity-70',
    dark: 'text-brand-muted placeholder:opacity-70',
} as const;

const iconColors = {
    light: 'text-brand opacity-60',
    brand: 'text-brand-pale opacity-70',
    dark: 'text-brand-muted opacity-70',
} as const;
</script>
