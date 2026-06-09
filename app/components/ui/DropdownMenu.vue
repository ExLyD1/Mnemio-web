<template>
    <UiPopover :align="align">
        <template #trigger="{ toggle, open }">
            <slot name="trigger" :toggle="toggle" :open="open" />
        </template>
        <template #default="{ close }">
            <button
                v-for="item in items"
                :key="item.key"
                type="button"
                role="menuitem"
                :disabled="item.disabled"
                :class="[
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-body transition-colors disabled:opacity-40',
                    modelValue === item.key
                        ? 'bg-brand/30 text-cream'
                        : item.danger
                          ? 'text-error-soft hover:bg-brand/20'
                          : 'text-brand-pale hover:bg-brand/20',
                ]"
                @click="select(item.key, close)"
            >
                <component :is="item.icon" v-if="item.icon" class="size-4 shrink-0" />
                <span class="flex-1">{{ item.label }}</span>
                <Check v-if="modelValue === item.key" class="size-4 shrink-0 text-lavender" />
            </button>
        </template>
    </UiPopover>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import { Check } from 'lucide-vue-next';

interface DropdownItem {
    key: string;
    label: string;
    icon?: Component;
    disabled?: boolean;
    danger?: boolean;
}

withDefaults(
    defineProps<{
        items: DropdownItem[];
        modelValue?: string;
        align?: 'left' | 'right';
    }>(),
    { align: 'right' },
);

const emit = defineEmits<{ select: [key: string] }>();

const select = (key: string, close: () => void) => {
    emit('select', key);
    close();
};
</script>
