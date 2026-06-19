<template>
    <div class="flex flex-wrap items-center gap-2">
        <button
            v-for="opt in options"
            :key="opt.key"
            type="button"
            :class="[
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-small font-semibold transition-colors',
                modelValue === opt.key
                    ? 'border-pink-soft/30 bg-brand text-cream'
                    : 'border-line-strong text-cream-faint hover:text-cream',
            ]"
            @click="$emit('update:modelValue', opt.key)"
        >
            {{ opt.label }}
            <span
                v-if="opt.count !== undefined"
                :class="modelValue === opt.key ? 'text-cream/70' : 'text-cream-faint/70'"
            >
                {{ opt.count }}
            </span>
        </button>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string;
    options: { key: string; label: string; count?: number }[];
}>();

defineEmits<{ 'update:modelValue': [value: string] }>();
</script>
