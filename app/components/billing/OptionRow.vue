<template>
    <div
        ref="group"
        role="radiogroup"
        :aria-label="label"
        :class="['grid gap-2', horizontal ? 'grid-cols-2' : 'grid-cols-1']"
        @keydown="onKey"
    >
        <button
            v-for="option in options"
            :key="option.value"
            type="button"
            role="radio"
            :aria-checked="modelValue === option.value"
            :tabindex="
                modelValue === option.value || (modelValue == null && option === options[0])
                    ? 0
                    : -1
            "
            :disabled="disabled"
            :class="[
                'flex min-h-11 min-w-0 items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-cream focus-visible:outline-none focus-visible:shadow-focus-ring disabled:cursor-not-allowed disabled:opacity-50',
                modelValue === option.value
                    ? 'border-purple bg-bg-deep'
                    : 'border-line hover:bg-bg-surface-2',
            ]"
            @click="emit('update:modelValue', option.value)"
        >
            <span
                :class="[
                    'grid size-5 shrink-0 place-items-center rounded-full border-2',
                    modelValue === option.value ? 'border-purple' : 'border-line-strong',
                ]"
                ><span v-if="modelValue === option.value" class="size-2.5 rounded-full bg-purple"
            /></span>
            <span class="min-w-0 flex-1"
                ><span class="block text-[15px] font-semibold">{{ option.title }}</span
                ><span v-if="option.subtitle" class="block text-small text-cream-faint">{{
                    option.subtitle
                }}</span
                ><span v-if="option.price" class="mt-1 block font-display text-[24px]">{{
                    option.price
                }}</span></span
            >
        </button>
    </div>
</template>
<script setup lang="ts" generic="T extends string | number">
const props = defineProps<{
    modelValue: T | null;
    options: { value: T; title: string; subtitle?: string; price?: string }[];
    label: string;
    horizontal?: boolean;
    disabled?: boolean;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: T] }>();
const group = ref<HTMLElement | null>(null);
const onKey = (event: KeyboardEvent) => {
    if (
        props.disabled ||
        !['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)
    )
        return;
    event.preventDefault();
    const index = props.options.findIndex((o) => o.value === props.modelValue);
    const next =
        event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? props.options.length - 1
              : (index +
                    (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) +
                    props.options.length) %
                props.options.length;
    const option = props.options[next];
    if (option) {
        emit('update:modelValue', option.value);
        group.value?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
    }
};
</script>
