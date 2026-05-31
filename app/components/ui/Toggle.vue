<template>
    <button
        type="button"
        role="switch"
        :aria-checked="modelValue"
        :class="[
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand-pale',
            modelValue ? 'bg-brand' : 'bg-bg-muted',
        ]"
        @click="$emit('update:modelValue', !modelValue)"
    >
        <span
            :class="[
                'inline-block size-5 transform rounded-full bg-neutral-0 transition-transform',
                modelValue ? 'translate-x-5' : 'translate-x-0.5',
            ]"
        />
    </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>();
defineEmits<{ 'update:modelValue': [value: boolean] }>();
</script>
