<template>
    <UiDropdownMenu
        :items="options"
        :model-value="modelValue"
        align="right"
        @select="$emit('update:modelValue', $event)"
    >
        <template #trigger="{ toggle, open }">
            <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-line-strong px-3.5 py-1.5 text-small font-semibold text-brand-pale transition-colors hover:border-brand-muted"
                @click="toggle"
            >
                <ArrowUpDown class="size-3.5 text-brand-muted" />
                {{ currentLabel }}
                <ChevronDown
                    class="size-3.5 text-brand-muted transition-transform"
                    :class="open ? 'rotate-180' : ''"
                />
            </button>
        </template>
    </UiDropdownMenu>
</template>

<script setup lang="ts">
import { ArrowUpDown, ChevronDown } from 'lucide-vue-next';

const props = defineProps<{
    modelValue: string;
    options: { key: string; label: string }[];
}>();

defineEmits<{ 'update:modelValue': [value: string] }>();

const currentLabel = computed(
    () =>
        props.options.find((o) => o.key === props.modelValue)?.label ??
        props.options[0]?.label ??
        '',
);
</script>
