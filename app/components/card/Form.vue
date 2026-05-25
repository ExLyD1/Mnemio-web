<template>
    <form
        class="grid gap-3 rounded-2xl bg-bg-surface p-4 sm:grid-cols-[1fr_1fr_auto]"
        novalidate
        @submit="onSubmit"
    >
        <div>
            <UiInputField
                v-model="word"
                :label="t('card.word')"
                type="text"
                :placeholder="t('card.wordPlaceholder')"
            />
            <p v-if="wordError" class="mt-1.5 text-small text-error" aria-live="polite">
                {{ t(wordError) }}
            </p>
        </div>
        <div>
            <UiInputField
                v-model="definition"
                :label="t('card.definition')"
                type="text"
                :placeholder="t('card.definitionPlaceholder')"
            />
            <p v-if="definitionError" class="mt-1.5 text-small text-error" aria-live="polite">
                {{ t(definitionError) }}
            </p>
        </div>
        <div class="flex items-end">
            <UiButton type="submit" variant="light" :disabled="loading" class="h-[52px]">
                <UiSpinner v-if="loading" size="sm" class="mr-2" />
                {{ t('card.add') }}
            </UiButton>
        </div>
    </form>
</template>

<script setup lang="ts">
import { useForm, useField } from 'vee-validate';
import { cardSchema } from '@/schemas/card';
import { toFormValidator } from '@/utils/zodValidator';
import { useT } from '@/composables/useT';

withDefaults(defineProps<{ loading?: boolean }>(), { loading: false });
const emit = defineEmits<{
    submit: [payload: { word: string; definition: string; phonetic: string | null }];
}>();

const { t } = useT();

const { handleSubmit, resetForm } = useForm({
    validationSchema: toFormValidator(cardSchema),
    initialValues: { word: '', definition: '', phonetic: '' },
});

const { value: word, errorMessage: wordError } = useField<string>('word');
const { value: definition, errorMessage: definitionError } = useField<string>('definition');

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        word: values.word,
        definition: values.definition,
        phonetic: values.phonetic?.trim() ? values.phonetic : null,
    });
    resetForm();
});
</script>
