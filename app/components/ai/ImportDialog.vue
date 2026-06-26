<template>
    <UiModal
        :model-value="modelValue"
        size="lg"
        :title="props.deck ? t('ai.titleAppend') : t('ai.titleNew')"
        @update:model-value="onModelUpdate"
    >
        <!-- Step 1: paste words -->
        <div v-if="step === 'input'" class="flex flex-col gap-4">
            <div v-if="!props.deck">
                <UiInputField
                    v-model="newTitle"
                    :label="t('ai.titleLabel')"
                    :placeholder="t('ai.titlePlaceholder')"
                />
            </div>

            <div>
                <span class="mb-1 block text-small text-brand-muted">{{ t('ai.wordsLabel') }}</span>
                <textarea
                    v-model="rawWords"
                    rows="6"
                    :placeholder="t('ai.wordsPlaceholder')"
                    class="w-full resize-y rounded-xl border border-brand-muted bg-transparent px-4 py-2.5 text-body text-brand-pale outline-none focus:border-brand-bright"
                />
                <p class="mt-1 text-small text-brand-muted">
                    {{ t('ai.wordsHint').replace('{n}', String(parsedCount)) }}
                </p>
            </div>

            <div v-if="!props.deck" class="grid gap-3 sm:grid-cols-2">
                <UiSelect
                    v-model="newTgt"
                    :label="t('deck.frontLang')"
                    :options="languageOptions"
                />
                <UiSelect v-model="newSrc" :label="t('deck.backLang')" :options="languageOptions" />
            </div>

            <UiInputField
                v-model="context"
                :label="t('ai.contextLabel')"
                :placeholder="t('ai.contextPlaceholder')"
            />

            <p v-if="error" class="text-small text-error-soft">{{ error }}</p>
        </div>

        <!-- Step 2: review -->
        <div v-else class="flex flex-col gap-3">
            <UiInputField
                v-if="!props.deck"
                v-model="newTitle"
                :label="t('ai.titleLabel')"
                :placeholder="t('ai.titlePlaceholder')"
            />

            <div class="flex flex-wrap items-baseline gap-x-2">
                <p class="text-small text-brand-muted">{{ t('ai.reviewHint') }}</p>
                <span v-if="unfilledCount" class="text-small text-error-soft">
                    {{ t('ai.unfilledCount').replace('{n}', String(unfilledCount)) }}
                </span>
            </div>
            <p v-if="meta" class="text-small text-brand-muted">
                {{
                    t('ai.reviewSummary')
                        .replace('{enriched}', String(meta.enriched))
                        .replace('{requested}', String(meta.requested))
                }}
            </p>

            <div class="max-h-[52vh] overflow-y-auto pr-1">
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

            <p v-if="error" class="text-small text-error-soft">{{ error }}</p>
        </div>

        <template #footer>
            <template v-if="step === 'input'">
                <UiButton variant="ghost" @click="close">{{ t('common.cancel') }}</UiButton>
                <UiButton variant="primary" :disabled="!parsedCount || loading" @click="onEnrich">
                    <UiSpinner v-if="loading" size="sm" class="mr-2" />
                    {{ loading ? t('ai.generating') : t('ai.generate') }}
                </UiButton>
            </template>
            <template v-else>
                <UiButton variant="ghost" :disabled="committing" @click="step = 'input'">
                    {{ t('common.back') }}
                </UiButton>
                <UiButton
                    variant="primary"
                    :disabled="!committableCount || committing || (!props.deck && !newTitle.trim())"
                    @click="onCommit"
                >
                    <UiSpinner v-if="committing" size="sm" class="mr-2" />
                    {{
                        (props.deck ? t('ai.addN') : t('ai.createN')).replace(
                            '{n}',
                            String(committableCount),
                        )
                    }}
                </UiButton>
            </template>
        </template>
    </UiModal>
</template>

<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next';
import { useT } from '#imports';
import { useAiImport } from '@/composables/useAiImport';
import { LANGUAGES } from '@/schemas/deck';

const props = withDefaults(
    defineProps<{
        modelValue: boolean;
        /** When set, cards are appended to this deck; otherwise a new deck is created. */
        deck?: { id: string; sourceLanguage: string; targetLanguage: string } | null;
    }>(),
    { deck: null },
);

const emit = defineEmits<{ 'update:modelValue': [boolean]; done: [] }>();

const { t } = useT();

const languageOptions = LANGUAGES.map((l) => ({ value: l.code, label: l.label }));

const close = () => emit('update:modelValue', false);
const onModelUpdate = (open: boolean) => {
    if (!open) {
        close();
    }
};

const {
    step,
    rawWords,
    newTitle,
    newSrc,
    newTgt,
    context,
    rows,
    meta,
    loading,
    committing,
    error,
    parsedCount,
    committableCount,
    unfilledCount,
    rowTone,
    reset,
    onEnrich,
    onCommit,
} = useAiImport({
    deck: () => props.deck,
    onAppended: () => {
        emit('done');
        close();
    },
    onCreated: (deckId) => {
        close();
        navigateTo(`/decks/${deckId}`);
    },
});

watch(
    () => props.modelValue,
    (open) => {
        if (open) {
            reset();
        }
    },
);
</script>
