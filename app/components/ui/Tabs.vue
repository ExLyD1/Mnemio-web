<template>
    <div class="flex gap-6 border-b border-brand-muted">
        <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            :class="[
                'relative pb-3 text-body transition-colors',
                modelValue === tab.key ? 'text-cream' : 'text-brand-muted hover:text-brand-pale',
            ]"
            @click="$emit('update:modelValue', tab.key)"
        >
            {{ tab.label }}
            <span
                v-if="modelValue === tab.key"
                class="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-[#E84B8A]"
            />
        </button>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string;
    tabs: { key: string; label: string }[];
}>();

defineEmits<{ 'update:modelValue': [value: string] }>();
</script>
