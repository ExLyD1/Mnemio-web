<template>
    <div class="flex flex-col items-center gap-6">
        <div
            class="flex min-h-[280px] w-full max-w-2xl items-center justify-center rounded-3xl border border-line bg-plum-card p-10 text-center shadow-flash-card"
        >
            <div class="text-eyebrow uppercase text-cream-faint">{{ t('study.front') }}</div>
            <div
                class="mt-4 font-display text-cream"
                style="font-size: clamp(36px, 5.5vw, 64px); line-height: 1.1"
            >
                {{ question.prompt }}
            </div>
        </div>

        <div class="grid w-full max-w-2xl gap-2.5 sm:grid-cols-2">
            <button
                v-for="(opt, i) in question.options"
                :key="opt.id"
                type="button"
                :disabled="picked !== null"
                :class="optionClass(opt.id)"
                @click="onPick(opt.id)"
            >
                <span
                    class="mr-3 inline-flex size-6 items-center justify-center rounded-md border border-line-strong text-small text-cream-faint"
                >
                    {{ i + 1 }}
                </span>
                <span class="text-left">{{ opt.text }}</span>
                <Check
                    v-if="picked !== null && opt.id === question.correctId"
                    class="ml-auto size-4 text-success"
                />
                <X
                    v-if="picked === opt.id && picked !== question.correctId"
                    class="ml-auto size-4 text-pink-soft"
                />
            </button>
        </div>

        <button
            v-if="picked !== null"
            type="button"
            class="rounded-full border border-line-strong bg-bg-surface px-5 py-2.5 text-small font-semibold text-cream transition-colors hover:bg-bg-surface-2"
            @click="$emit('next')"
        >
            {{ t('study.continue') }} →
        </button>
    </div>
</template>

<script setup lang="ts">
import { Check, X } from 'lucide-vue-next';
import type { MultipleChoiceQuestion } from '@/composables/useMultipleChoice';
import { useT } from '@/composables/useT';

const props = defineProps<{ question: MultipleChoiceQuestion }>();
const emit = defineEmits<{ answer: [correct: boolean]; next: [] }>();

const { t } = useT();
const picked = ref<string | null>(null);

watch(
    () => props.question,
    () => {
        picked.value = null;
    },
);

const onPick = (id: string) => {
    if (picked.value !== null) return;
    picked.value = id;
    emit('answer', id === props.question.correctId);
};

const handleKey = (e: KeyboardEvent) => {
    if (picked.value !== null) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            emit('next');
        }
        return;
    }
    const n = Number(e.key);
    if (n >= 1 && n <= props.question.options.length) {
        onPick(props.question.options[n - 1]!.id);
    }
};

onMounted(() => window.addEventListener('keydown', handleKey));
onBeforeUnmount(() => window.removeEventListener('keydown', handleKey));

const optionClass = (id: string) => {
    const base =
        'flex items-center gap-1 rounded-2xl border bg-bg-surface px-5 py-4 text-body text-cream transition-colors';
    if (picked.value === null) {
        return `${base} border-line hover:border-line-strong hover:bg-bg-surface-2`;
    }
    if (id === props.question.correctId) {
        return `${base} border-success/60 bg-success/10 text-cream`;
    }
    if (id === picked.value) {
        return `${base} border-pink-soft/60 bg-pink-soft/10 text-cream`;
    }
    return `${base} border-line opacity-50`;
};
</script>
