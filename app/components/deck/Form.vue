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

        <div class="mt-2 flex justify-end gap-2">
            <UiButton type="button" variant="ghost" :disabled="loading" @click="$emit('cancel')">
                {{ t('common.cancel') }}
            </UiButton>
            <UiButton type="submit" variant="light" :disabled="loading">
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
import type { Deck } from '@/types/deck';

const props = withDefaults(
    defineProps<{
        initial?: Pick<Deck, 'title' | 'description' | 'sourceLanguage' | 'targetLanguage'> | null;
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
        },
    ];
    cancel: [];
}>();

const { t } = useT();

const { handleSubmit } = useForm({
    validationSchema: toFormValidator(deckSchema),
    initialValues: {
        title: props.initial?.title ?? '',
        description: props.initial?.description ?? '',
        // Language is chosen at creation and is immutable afterward — not editable
        // here, but preserved unchanged in the payload so the deck keeps its pair.
        sourceLanguage: props.initial?.sourceLanguage ?? 'en',
        targetLanguage: props.initial?.targetLanguage ?? 'es',
        // Every deck is public; kept in the schema/payload but no longer user-editable.
        isPublic: true,
    },
});

const { value: title, errorMessage: titleError } = useField<string>('title');
const { value: description, errorMessage: descriptionError } = useField<string>('description');

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        title: values.title,
        description: values.description?.trim() ? values.description : null,
        sourceLanguage: values.sourceLanguage,
        targetLanguage: values.targetLanguage,
        isPublic: true,
    });
});
</script>
