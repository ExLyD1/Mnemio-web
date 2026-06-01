<template>
    <div class="grid gap-2.5" :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }">
        <button
            v-for="opt in options"
            :key="opt.value"
            type="button"
            :class="[
                'flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
                modelValue === opt.value
                    ? 'border-brand-bright bg-brand/25 shadow-[inset_0_0_0_1px_rgba(124,69,118,0.5)]'
                    : 'border-line-strong bg-bg-surface-2 hover:border-brand-muted',
            ]"
            @click="$emit('update:modelValue', opt.value)"
        >
            <component
                :is="opt.icon"
                v-if="opt.icon"
                class="mt-0.5 size-5 shrink-0 text-brand-pale"
            />
            <span class="min-w-0 flex-1">
                <span class="flex items-center justify-between gap-2">
                    <span class="text-body font-semibold text-cream">{{ opt.label }}</span>
                    <span
                        :class="[
                            'grid size-4 shrink-0 place-items-center rounded-full border',
                            modelValue === opt.value ? 'border-lavender' : 'border-brand-muted',
                        ]"
                    >
                        <span
                            v-if="modelValue === opt.value"
                            class="size-2 rounded-full bg-lavender"
                        />
                    </span>
                </span>
                <span v-if="opt.note" class="mt-0.5 block text-small text-cream-faint">{{
                    opt.note
                }}</span>
            </span>
        </button>
    </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

interface RadioOption {
    value: string;
    label: string;
    note?: string;
    icon?: Component;
}

const props = withDefaults(
    defineProps<{ modelValue: string; options: RadioOption[]; columns?: number }>(),
    { columns: 0 },
);

defineEmits<{ 'update:modelValue': [value: string] }>();

const cols = computed(() => props.columns || props.options.length || 1);
</script>
