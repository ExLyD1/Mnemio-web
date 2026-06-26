<template>
    <div class="flex w-full gap-1.5 sm:gap-2">
        <input
            v-for="(_, i) in length"
            :key="i"
            :ref="
                (el) => {
                    if (el) inputs[i] = el as HTMLInputElement;
                }
            "
            v-model="digits[i]"
            type="text"
            inputmode="numeric"
            maxlength="1"
            :class="[
                'aspect-square min-w-0 max-w-14 flex-1 rounded-xl border bg-transparent text-center text-h3 font-semibold text-neutral-0 outline-none transition-colors',
                digits[i] ? 'border-brand-pale' : 'border-brand-muted',
                'focus:border-brand-pale',
            ]"
            @input="onInput(i)"
            @keydown.backspace="onBackspace(i)"
            @paste.prevent="onPaste($event)"
        />
    </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ modelValue?: string; length?: number }>(), {
    modelValue: '',
    length: 6,
});
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const inputs = ref<HTMLInputElement[]>([]);
const digits = ref<string[]>(
    Array.from({ length: props.length }, (_, i) => props.modelValue[i] ?? ''),
);

function onInput(i: number) {
    const val = digits.value[i]?.replace(/\D/g, '') ?? '';
    digits.value[i] = val;
    if (val && i < props.length - 1) inputs.value[i + 1]?.focus();
    emit('update:modelValue', digits.value.join(''));
}

function onBackspace(i: number) {
    if (!digits.value[i] && i > 0) {
        digits.value[i - 1] = '';
        inputs.value[i - 1]?.focus();
        emit('update:modelValue', digits.value.join(''));
    }
}

function onPaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text').replace(/\D/g, '').slice(0, props.length) ?? '';
    text.split('').forEach((char, i) => {
        digits.value[i] = char;
    });
    inputs.value[Math.min(text.length, props.length - 1)]?.focus();
    emit('update:modelValue', digits.value.join(''));
}
</script>
