<template>
    <label class="block">
        <span v-if="label" class="mb-1 block text-small text-brand-muted">{{ label }}</span>
        <div class="relative">
            <select
                :value="modelValue"
                class="w-full appearance-none rounded-xl border border-brand-muted bg-transparent px-4 py-2.5 pr-9 text-body text-brand-pale outline-none focus:border-brand-pale"
                v-bind="$attrs"
                @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
            >
                <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
                <option v-for="opt in options" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                </option>
            </select>
            <ChevronDown
                class="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted"
            />
        </div>
    </label>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';

defineOptions({ inheritAttrs: false });

defineProps<{
    modelValue: string;
    options: { value: string; label: string }[];
    label?: string;
    placeholder?: string;
}>();

defineEmits<{ 'update:modelValue': [value: string] }>();
</script>
