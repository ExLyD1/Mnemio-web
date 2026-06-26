<template>
    <div
        class="flex flex-wrap items-center gap-2 rounded-xl border border-brand-muted px-3 py-2.5 transition-colors focus-within:border-brand-bright"
        @click="focusInput"
    >
        <span
            v-for="(chip, i) in modelValue"
            :key="`${chip}-${i}`"
            class="inline-flex items-center gap-1.5 rounded-full border border-brand-bright/45 bg-brand/30 py-1 pl-3 pr-1.5 text-small font-semibold text-brand-pale"
        >
            {{ chip }}
            <button
                type="button"
                class="grid size-4 place-items-center rounded-full text-brand-muted transition-colors dark:hover:bg-white/10 hover:bg-brand/15 hover:text-cream"
                :aria-label="`Remove ${chip}`"
                @click.stop="removeAt(i)"
            >
                <X class="size-3" />
            </button>
        </span>
        <input
            ref="inputEl"
            v-model="draft"
            :placeholder="modelValue.length ? '' : placeholder"
            class="min-w-[6rem] flex-1 bg-transparent text-body text-brand-pale outline-none placeholder:text-brand-muted/50"
            @keydown.enter.prevent="commit"
            @keydown="onComma"
            @keydown.backspace="onBackspace"
        />
    </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';

const props = withDefaults(
    defineProps<{ modelValue: string[]; placeholder?: string; max?: number }>(),
    { placeholder: 'Add…', max: 0 },
);

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>();

const draft = ref('');
const inputEl = ref<HTMLInputElement | null>(null);

const focusInput = () => inputEl.value?.focus();

const commit = () => {
    const value = draft.value.trim();
    if (!value) {
        return;
    }
    if (props.max && props.modelValue.length >= props.max) {
        return;
    }
    if (props.modelValue.includes(value)) {
        draft.value = '';
        return;
    }
    emit('update:modelValue', [...props.modelValue, value]);
    draft.value = '';
};

const onComma = (e: KeyboardEvent) => {
    if (e.key === ',') {
        e.preventDefault();
        commit();
    }
};

const onBackspace = () => {
    if (draft.value === '' && props.modelValue.length) {
        emit('update:modelValue', props.modelValue.slice(0, -1));
    }
};

const removeAt = (i: number) => {
    emit(
        'update:modelValue',
        props.modelValue.filter((_, idx) => idx !== i),
    );
};
</script>
