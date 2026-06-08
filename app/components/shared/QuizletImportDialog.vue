<template>
    <UiModal
        :model-value="modelValue"
        size="lg"
        :title="t('quizlet.title')"
        @update:model-value="onModelUpdate"
    >
        <!-- Step 1: paste URL -->
        <div v-if="step === 'input'" class="flex flex-col gap-4">
            <UiInputField
                v-model="newTitle"
                :label="t('ai.titleLabel')"
                :placeholder="t('ai.titlePlaceholder')"
            />

            <div>
                <UiInputField
                    v-model="url"
                    :label="t('quizlet.urlLabel')"
                    :placeholder="t('quizlet.urlPlaceholder')"
                />
                <p class="mt-1 text-small text-brand-muted">{{ t('quizlet.urlHint') }}</p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
                <UiSelect
                    v-model="newTgt"
                    :label="t('deck.frontLang')"
                    :options="languageOptions"
                />
                <UiSelect v-model="newSrc" :label="t('deck.backLang')" :options="languageOptions" />
            </div>

            <p v-if="error" class="text-small text-error-soft">{{ error }}</p>
        </div>

        <!-- Step 2: review -->
        <div v-else class="flex flex-col gap-3">
            <UiInputField
                v-model="newTitle"
                :label="t('ai.titleLabel')"
                :placeholder="t('ai.titlePlaceholder')"
            />
            <p class="text-small text-brand-muted">{{ t('quizlet.reviewHint') }}</p>

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
                <UiButton variant="primary" :disabled="!url.trim() || loading" @click="onFetch">
                    <UiSpinner v-if="loading" size="sm" class="mr-2" />
                    {{ loading ? t('quizlet.fetching') : t('quizlet.fetch') }}
                </UiButton>
            </template>
            <template v-else>
                <UiButton variant="ghost" :disabled="committing" @click="step = 'input'">
                    {{ t('common.back') }}
                </UiButton>
                <UiButton
                    variant="primary"
                    :disabled="!committableCount || committing || !newTitle.trim()"
                    @click="onCommit"
                >
                    <UiSpinner v-if="committing" size="sm" class="mr-2" />
                    {{ t('quizlet.createN').replace('{n}', String(committableCount)) }}
                </UiButton>
            </template>
        </template>
    </UiModal>
</template>

<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next';
import { useDecks, useToast, useT } from '#imports';
import { bulkAddCards } from '@/api/cards';
import { LANGUAGES } from '@/schemas/deck';
import type { CardInput } from '@/types/deck';

interface ReviewRow {
    word: string;
    definition: string;
    include: boolean;
}

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean]; done: [] }>();

const { create } = useDecks();
const toast = useToast();
const { t } = useT();

const languageOptions = LANGUAGES.map((l) => ({ value: l.code, label: l.label }));

const step = ref<'input' | 'review'>('input');
const url = ref('');
const newTitle = ref('');
const newTgt = ref('en');
const newSrc = ref('en');
const rows = ref<ReviewRow[]>([]);
const loading = ref(false);
const committing = ref(false);
const error = ref('');

const committableCount = computed(
    () => rows.value.filter((r) => r.include && r.definition.trim().length > 0).length,
);

const rowTone = (row: ReviewRow): string => {
    if (!row.include) {
        return 'border-line bg-bg-surface-2 opacity-50';
    }
    return row.definition.trim()
        ? 'border-line bg-bg-surface-2'
        : 'border-error-soft/60 bg-error-soft/5';
};

const reset = () => {
    step.value = 'input';
    url.value = '';
    newTitle.value = '';
    rows.value = [];
    loading.value = false;
    committing.value = false;
    error.value = '';
};

const close = () => emit('update:modelValue', false);
const onModelUpdate = (open: boolean) => {
    if (!open) {
        close();
    }
};

const messageFor = (statusMessage: string): string => {
    if (statusMessage === 'QUIZLET_INVALID_URL') {
        return t('quizlet.errorInvalidUrl');
    }
    if (statusMessage === 'QUIZLET_PARSE_FAILED') {
        return t('quizlet.errorParse');
    }
    return t('quizlet.errorFetch');
};

const onFetch = async () => {
    if (!url.value.trim()) {
        error.value = t('quizlet.empty');
        return;
    }
    error.value = '';
    loading.value = true;
    try {
        const res = await $fetch<{ title: string; cards: { word: string; definition: string }[] }>(
            '/quizlet-import',
            { method: 'POST', body: { url: url.value.trim() } },
        );
        rows.value = res.cards.map((c) => ({
            word: c.word,
            definition: c.definition,
            include: true,
        }));
        if (!newTitle.value.trim() && res.title) {
            newTitle.value = res.title;
        }
        step.value = 'review';
    } catch (e) {
        const status = (e as { data?: { statusMessage?: string }; statusMessage?: string }) ?? {};
        error.value = messageFor(status.data?.statusMessage ?? status.statusMessage ?? '');
    } finally {
        loading.value = false;
    }
};

const onCommit = async () => {
    const cards: CardInput[] = rows.value
        .filter((r) => r.include && r.definition.trim().length > 0)
        .map((r) => ({ word: r.word.trim(), definition: r.definition.trim(), phonetic: null }));
    if (!cards.length || !newTitle.value.trim()) {
        return;
    }
    error.value = '';
    committing.value = true;
    try {
        const deck = await create.execute({
            title: newTitle.value.trim(),
            description: null,
            sourceLanguage: newSrc.value,
            targetLanguage: newTgt.value,
        });
        if (!deck) {
            error.value = create.error.value?.message ?? t('quizlet.errorParse');
            return;
        }
        await bulkAddCards(deck.id, cards);
        toast.success(t('ai.added').replace('{n}', String(cards.length)));
        emit('done');
        reset();
        close();
        await navigateTo(`/decks/${deck.id}`);
    } catch (e) {
        error.value = (e as { message?: string }).message ?? t('quizlet.errorParse');
    } finally {
        committing.value = false;
    }
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
