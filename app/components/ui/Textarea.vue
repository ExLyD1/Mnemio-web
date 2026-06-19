<template>
    <div
        class="rounded-xl border border-brand-muted bg-bg-well px-4 pb-3 pt-2 transition-colors focus-within:border-brand-bright focus-within:shadow-[0_0_0_3px_rgba(124,69,118,0.18)]"
    >
        <span v-if="label" class="mb-0.5 block text-[11px] leading-none text-brand-muted">{{
            label
        }}</span>
        <textarea
            :value="modelValue"
            :rows="rows"
            :maxlength="maxlength"
            :placeholder="placeholder"
            :class="[
                'block w-full resize-none bg-transparent text-brand-pale outline-none placeholder:text-brand-muted/50',
                serif ? 'font-display text-2xl leading-snug' : 'text-body',
            ]"
            v-bind="$attrs"
            @input="onInput"
        />
        <div v-if="maxlength" class="mt-1 text-right text-[11px] text-brand-muted/70">
            {{ modelValue.length }}/{{ maxlength }}
        </div>
    </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

withDefaults(
    defineProps<{
        modelValue: string;
        label?: string;
        placeholder?: string;
        rows?: number;
        maxlength?: number;
        serif?: boolean;
    }>(),
    { placeholder: '', rows: 3, serif: false },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const onInput = (e: Event) => emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
</script>
