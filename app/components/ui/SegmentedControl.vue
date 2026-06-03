<template>
    <div
        class="inline-flex items-center gap-1 rounded-full border border-line-strong bg-bg-surface p-1"
    >
        <button
            v-for="opt in options"
            :key="opt.value"
            type="button"
            :class="[
                'rounded-full px-4 py-1.5 text-small font-semibold transition-colors',
                modelValue === opt.value
                    ? 'bg-brand text-cream shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                    : 'text-brand-muted hover:text-brand-pale',
            ]"
            @click="$emit('update:modelValue', opt.value)"
        >
            {{ opt.label }}
        </button>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string;
    options: { value: string; label: string }[];
}>();

defineEmits<{ 'update:modelValue': [value: string] }>();
</script>
