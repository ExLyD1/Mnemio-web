<template>
    <form class="flex flex-col gap-4" novalidate @submit="onSubmit">
        <div>
            <UiInputField
                v-model="title"
                :label="t('deck.title')"
                type="text"
                :placeholder="t('deck.titlePlaceholder')"
            />
            <p v-if="titleError" class="mt-1.5 text-small text-error" aria-live="polite">
                {{ t(titleError) }}
            </p>
        </div>

        <div>
            <UiInputField
                v-model="description"
                :label="t('deck.description')"
                type="text"
                :placeholder="t('deck.descriptionPlaceholder')"
            />
            <p v-if="descriptionError" class="mt-1.5 text-small text-error" aria-live="polite">
                {{ t(descriptionError) }}
            </p>
        </div>

        <div>
            <p class="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-cream/40">
                {{ t('deck.categoryLabel') }}
            </p>
            <UiCategorySelect
                v-model="subject"
                :options="categoryOptions"
                :placeholder="t('deck.category.other')"
            />
        </div>

        <div>
            <p class="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-cream/40">
                {{ t('deck.privacy') }}
            </p>
            <div class="flex gap-2">
                <button
                    type="button"
                    class="flex-1 rounded-xl border px-3 py-2.5 text-center text-small font-medium transition-colors"
                    :class="
                        isPublic
                            ? 'border-brand bg-brand text-on-color'
                            : 'border-line-strong text-cream hover:border-cream-dim hover:bg-brand/10'
                    "
                    @click="isPublic = true"
                >
                    {{ t('deck.privacyPublic') }}
                </button>
                <button
                    type="button"
                    class="flex-1 rounded-xl border px-3 py-2.5 text-center text-small font-medium transition-colors"
                    :class="
                        !isPublic
                            ? 'border-brand bg-brand text-on-color'
                            : 'border-line-strong text-cream hover:border-cream-dim hover:bg-brand/10'
                    "
                    @click="isPublic = false"
                >
                    {{ t('deck.privacyPrivate') }}
                </button>
            </div>
            <p class="mt-1.5 text-small text-brand-muted">
                {{ isPublic ? t('deck.publicHint') : t('deck.privacyPrivateHint') }}
            </p>
        </div>

        <div class="mt-2 flex justify-end gap-2">
            <UiButton type="button" variant="ghost" :disabled="loading" @click="$emit('cancel')">
                {{ t('common.cancel') }}
            </UiButton>
            <UiButton type="submit" variant="primary" :disabled="loading">
                <UiSpinner v-if="loading" size="sm" class="mr-2" />
                {{ submitLabel ?? t('common.save') }}
            </UiButton>
        </div>
    </form>
</template>

<script setup lang="ts">
import { useForm, useField } from 'vee-validate';
import { deckSchema } from '@/schemas/deck';
import { toFormValidator } from '@/utils/zodValidator';
import { useT } from '@/composables/useT';
import { DECK_CATEGORIES } from '@/utils/deckCategories';
import type { DeckCategory } from '@/utils/deckCategories';
import type { Deck } from '@/types/deck';

const props = withDefaults(
    defineProps<{
        initial?: Pick<
            Deck,
            'title' | 'description' | 'sourceLanguage' | 'targetLanguage' | 'isPublic' | 'subject'
        > | null;
        loading?: boolean;
        submitLabel?: string;
    }>(),
    { initial: null, loading: false },
);

const emit = defineEmits<{
    submit: [
        payload: {
            title: string;
            description: string | null;
            sourceLanguage: string;
            targetLanguage: string;
            isPublic: boolean;
            subject: DeckCategory;
        },
    ];
    cancel: [];
}>();

const { t } = useT();

const categoryOptions = DECK_CATEGORIES.map((cat) => ({
    value: cat,
    label: t(`deck.category.${cat}`),
}));

const { handleSubmit } = useForm({
    validationSchema: toFormValidator(deckSchema),
    initialValues: {
        title: props.initial?.title ?? '',
        description: props.initial?.description ?? '',
        // Language is chosen at creation and is immutable afterward — not editable
        // here, but preserved unchanged in the payload so the deck keeps its pair.
        sourceLanguage: props.initial?.sourceLanguage ?? 'en',
        targetLanguage: props.initial?.targetLanguage ?? 'es',
        isPublic: props.initial?.isPublic ?? true,
        subject: (props.initial?.subject as DeckCategory | null) ?? 'other',
    },
});

const { value: title, errorMessage: titleError } = useField<string>('title');
const { value: description, errorMessage: descriptionError } = useField<string>('description');
const { value: isPublic } = useField<boolean>('isPublic');
const { value: subject } = useField<DeckCategory>('subject');

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        title: values.title,
        description: values.description?.trim() ? values.description : null,
        sourceLanguage: values.sourceLanguage,
        targetLanguage: values.targetLanguage,
        isPublic: values.isPublic,
        subject: values.subject as DeckCategory,
    });
});
</script>
