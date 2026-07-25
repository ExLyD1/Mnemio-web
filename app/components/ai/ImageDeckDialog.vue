<template>
    <UiModal
        :model-value="modelValue"
        size="lg"
        :title="t('image.title')"
        @update:model-value="onModelUpdate"
    >
        <!-- Step 1: choose an image -->
        <div v-if="step === 'input'" class="flex flex-col gap-4">
            <input
                ref="fileInput"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                class="hidden"
                @change="onPick"
            />

            <div
                class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-brand-muted p-6 text-center transition-colors focus-within:border-brand-bright"
                :class="dragging ? 'border-brand-bright bg-brand-bright/5' : ''"
                tabindex="0"
                @paste="onPaste"
                @dragover.prevent="dragging = true"
                @dragleave.prevent="dragging = false"
                @drop.prevent="onDrop"
            >
                <template v-if="previewUrl">
                    <img
                        :src="previewUrl"
                        :alt="t('image.previewAlt')"
                        class="max-h-52 w-auto rounded-xl border border-line object-contain"
                    />
                    <div class="flex gap-2">
                        <UiButton variant="ghost" @click="fileInput?.click()">
                            {{ t('image.changeImage') }}
                        </UiButton>
                        <UiButton variant="ghost" @click="clearFile">
                            {{ t('image.remove') }}
                        </UiButton>
                    </div>
                </template>
                <template v-else>
                    <ImagePlus class="size-8 text-brand-muted" />
                    <p class="text-body text-cream">{{ t('image.dropPrompt') }}</p>
                    <p class="text-small text-brand-muted">{{ t('image.pasteHint') }}</p>
                    <UiButton variant="light" @click="fileInput?.click()">
                        {{ t('image.chooseImage') }}
                    </UiButton>
                </template>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
                <UiSelect
                    v-model="targetLanguage"
                    :label="t('image.targetLangLabel')"
                    :options="targetOptions"
                />
                <UiSelect
                    v-model="countStr"
                    :label="t('image.countLabel')"
                    :options="countOptions"
                />
            </div>

            <p v-if="error" class="text-small text-error-soft">{{ error }}</p>
        </div>

        <!-- Step 2: streaming -->
        <div v-else-if="step === 'streaming'" class="flex flex-col gap-3">
            <div class="flex items-center gap-2 text-small text-brand-muted">
                <UiSpinner size="sm" />
                <span>{{
                    header
                        ? t('image.foundN').replace('{n}', String(rows.length))
                        : t('image.reading')
                }}</span>
            </div>
            <div v-if="header" class="rounded-xl border border-line bg-bg-surface-2 p-3">
                <p class="font-display text-base text-cream">
                    <span v-if="header.glyph" class="mr-1">{{ header.glyph }}</span
                    >{{ header.title }}
                </p>
                <p class="text-small text-brand-muted">
                    {{ header.targetLanguage }} → {{ header.sourceLanguage }}
                </p>
            </div>
            <div
                v-for="(row, i) in rows"
                :key="i"
                class="animate-in rounded-xl border border-line bg-bg-surface-2 p-3"
            >
                <p class="font-display text-base text-cream">{{ row.word }}</p>
                <p class="text-small text-brand-pale">{{ row.definition }}</p>
                <p v-if="row.example" class="mt-1 text-small italic text-brand-muted">
                    “{{ row.example }}”
                </p>
            </div>
        </div>

        <!-- Step 3: review (with honest empty state) -->
        <div v-else class="flex flex-col gap-3">
            <div
                v-if="note === 'no_text'"
                class="flex flex-col items-center gap-3 py-8 text-center"
            >
                <ImageOff class="size-8 text-brand-muted" />
                <p class="text-body text-cream">{{ t('image.noTextTitle') }}</p>
                <p class="max-w-sm text-small text-brand-muted">{{ t('image.noTextBody') }}</p>
                <UiButton variant="light" @click="step = 'input'">
                    {{ t('image.tryAnother') }}
                </UiButton>
            </div>

            <template v-else>
                <div v-if="header" class="rounded-xl border border-line bg-bg-surface-2 p-3">
                    <p class="font-display text-base text-cream">
                        <span v-if="header.glyph" class="mr-1">{{ header.glyph }}</span
                        >{{ header.title }}
                    </p>
                    <p class="text-small text-brand-muted">
                        {{ header.targetLanguage }} → {{ header.sourceLanguage }}
                    </p>
                </div>

                <div class="flex flex-wrap items-baseline gap-x-2">
                    <p class="text-small text-brand-muted">{{ t('image.reviewHint') }}</p>
                    <span v-if="unfilledCount" class="text-small text-error-soft">
                        {{ t('ai.unfilledCount').replace('{n}', String(unfilledCount)) }}
                    </span>
                </div>

                <div class="max-h-[46vh] overflow-y-auto pr-1">
                    <div
                        v-for="(row, i) in rows"
                        :key="i"
                        class="mb-2 flex items-start gap-3 rounded-xl border p-3"
                        :class="rowTone(row)"
                    >
                        <input
                            v-model="row.include"
                            type="checkbox"
                            class="mt-2.5 size-4 shrink-0 accent-brand-bright"
                            :aria-label="t('ai.includeCard')"
                        />
                        <div class="flex min-w-0 flex-1 flex-col gap-2">
                            <input
                                v-model="row.word"
                                type="text"
                                :placeholder="t('card.word')"
                                class="w-full break-words rounded-lg border border-brand-muted bg-transparent px-3 py-1.5 font-display text-base text-cream outline-none focus:border-brand-bright"
                            />
                            <textarea
                                v-model="row.definition"
                                rows="2"
                                :placeholder="t('ai.definitionPlaceholder')"
                                class="w-full resize-y rounded-lg border border-brand-muted bg-transparent px-3 py-1.5 text-small text-brand-pale outline-none focus:border-brand-bright"
                            />
                            <input
                                v-if="row.example"
                                v-model="row.example"
                                type="text"
                                :placeholder="t('image.examplePlaceholder')"
                                class="w-full rounded-lg border border-brand-muted bg-transparent px-3 py-1.5 text-small italic text-brand-muted outline-none focus:border-brand-bright"
                            />
                            <SharedPill v-if="!row.definition.trim()" tone="muted" class="w-fit">
                                {{ t('ai.unfilled') }}
                            </SharedPill>
                        </div>
                        <button
                            type="button"
                            class="mt-1.5 shrink-0 rounded-md p-1 text-brand-muted transition-colors hover:text-error-soft"
                            :aria-label="t('ai.remove')"
                            @click="rows.splice(i, 1)"
                        >
                            <Trash2 class="size-4" />
                        </button>
                    </div>
                </div>

                <!-- Refine pills -->
                <div class="flex flex-wrap gap-2">
                    <button
                        v-for="pill in refinePills"
                        :key="pill.hint"
                        type="button"
                        class="rounded-full border border-line px-3 py-1 text-small text-brand-pale transition-colors hover:border-brand-bright disabled:opacity-50"
                        :disabled="committing"
                        @click="refine(pill.hint)"
                    >
                        {{ pill.label }}
                    </button>
                </div>

                <p v-if="error" class="text-small text-error-soft">{{ error }}</p>
            </template>
        </div>

        <template #footer>
            <template v-if="step === 'input'">
                <UiButton variant="ghost" @click="close">{{ t('common.cancel') }}</UiButton>
                <UiButton variant="primary" :disabled="!file" @click="run">
                    {{ t('image.extract') }}
                </UiButton>
            </template>
            <template v-else-if="step === 'streaming'">
                <UiButton variant="ghost" @click="onModelUpdate(false)">
                    {{ t('common.cancel') }}
                </UiButton>
            </template>
            <template v-else-if="note !== 'no_text'">
                <UiButton variant="ghost" :disabled="committing" @click="step = 'input'">
                    {{ t('common.back') }}
                </UiButton>
                <UiButton
                    variant="primary"
                    :disabled="!committableCount || committing"
                    @click="commit"
                >
                    <UiSpinner v-if="committing" size="sm" class="mr-2" />
                    {{ t('image.createN').replace('{n}', String(committableCount)) }}
                </UiButton>
            </template>
        </template>
    </UiModal>
</template>

<script setup lang="ts">
import { ImagePlus, ImageOff, Trash2 } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useT } from '#imports';
import { useImageDeck, type RefineHint } from '@/composables/useImageDeck';
import { LANGUAGES } from '@/schemas/deck';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean]; created: [string] }>();

const { t } = useT();

const targetOptions = [
    { value: '', label: t('image.autoDetect') },
    ...LANGUAGES.map((l) => ({ value: l.code, label: l.label })),
];
const countOptions = [8, 12, 16, 20].map((n) => ({ value: String(n), label: String(n) }));
const refinePills: { hint: RefineHint; label: string }[] = [
    { hint: 'more', label: t('image.refineMore') },
    { hint: 'harder', label: t('image.refineHarder') },
    { hint: 'examples', label: t('image.refineExamples') },
];

const fileInput = ref<HTMLInputElement | null>(null);
const dragging = ref(false);

const close = () => emit('update:modelValue', false);
const onModelUpdate = (open: boolean) => {
    if (!open) {
        reset();
        close();
    }
};

const {
    step,
    file,
    previewUrl,
    header,
    rows,
    count,
    targetLanguage,
    note,
    error,
    committing,
    committableCount,
    unfilledCount,
    rowTone,
    setFile,
    run,
    refine,
    commit,
    reset,
} = useImageDeck({
    onCreated: (deckId) => {
        close();
        emit('created', deckId);
    },
});

// UiSelect binds strings; keep `count` (number) in sync.
const countStr = computed({
    get: () => String(count.value),
    set: (v: string) => (count.value = Number(v)),
});

const stage = (f: File | null) => {
    const msg = setFile(f);
    if (msg) {
        error.value = msg;
    }
};

const onPick = (e: Event) => {
    const input = e.target as HTMLInputElement;
    stage(input.files?.[0] ?? null);
    input.value = '';
};

const onDrop = (e: DragEvent) => {
    dragging.value = false;
    stage(e.dataTransfer?.files?.[0] ?? null);
};

const onPaste = (e: ClipboardEvent) => {
    const f = e.clipboardData?.files?.[0];
    if (f) {
        stage(f);
    }
};

const clearFile = () => {
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value);
    }
    previewUrl.value = null;
    file.value = null;
    error.value = '';
};

watch(
    () => props.modelValue,
    (open) => {
        if (open) {
            reset();
        }
    },
);
</script>
