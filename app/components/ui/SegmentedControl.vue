<template>
    <div
        :class="[
            'items-center gap-1 rounded-full border border-line-strong bg-bg-surface p-1',
            fluid ? 'flex w-full' : 'inline-flex',
        ]"
    >
        <button
            v-for="opt in options"
            :key="opt.value"
            type="button"
            :class="[
                'rounded-full py-1.5 text-small font-semibold transition-colors',
                fluid ? 'flex-1 truncate px-2 text-center' : 'px-4',
                modelValue === opt.value
                    ? 'bg-brand text-on-color shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                    : 'text-brand-muted hover:text-brand-pale',
            ]"
            @click="$emit('update:modelValue', opt.value)"
        >
            {{ opt.label }}
        </button>
    </div>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        modelValue: string;
        options: { value: string; label: string }[];
        fluid?: boolean;
    }>(),
    { fluid: false },
);

defineEmits<{ 'update:modelValue': [value: string] }>();
</script>
