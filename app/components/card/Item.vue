<template>
    <li class="flex flex-col gap-2 rounded-xl bg-bg-surface p-4 sm:flex-row sm:items-center sm:gap-4">
        <template v-if="editing">
            <UiInputField
                v-model="draftWord"
                :label="t('card.word')"
                type="text"
                class="flex-1"
            />
            <UiInputField
                v-model="draftDefinition"
                :label="t('card.definition')"
                type="text"
                class="flex-1"
            />
            <div class="flex gap-1">
                <UiButton variant="light" :disabled="loading" @click="onSave">
                    <UiSpinner v-if="loading" size="sm" />
                    <Check v-else class="size-4" />
                </UiButton>
                <UiButton variant="ghost" :disabled="loading" @click="cancel">
                    <X class="size-4" />
                </UiButton>
            </div>
        </template>
        <template v-else>
            <div class="flex flex-1 flex-col">
                <span class="text-body font-semibold text-neutral-0">{{ card.word }}</span>
                <span class="text-small text-brand-muted">{{ card.definition }}</span>
            </div>
            <div class="flex gap-1">
                <button
                    type="button"
                    class="rounded-md p-1.5 text-brand-muted transition-colors hover:bg-bg-muted hover:text-brand-pale"
                    :aria-label="t('card.edit')"
                    @click="editing = true"
                >
                    <Pencil class="size-4" />
                </button>
                <button
                    type="button"
                    class="rounded-md p-1.5 text-brand-muted transition-colors hover:bg-bg-muted hover:text-error"
                    :aria-label="t('card.delete')"
                    @click="$emit('delete', card.id)"
                >
                    <Trash2 class="size-4" />
                </button>
            </div>
        </template>
    </li>
</template>

<script setup lang="ts">
import { Pencil, Trash2, Check, X } from 'lucide-vue-next';
import type { Card } from '@/types/deck';
import { useT } from '@/composables/useT';

const props = defineProps<{ card: Card; loading?: boolean }>();
const emit = defineEmits<{
    save: [id: string, input: { word: string; definition: string }];
    delete: [id: string];
}>();

const { t } = useT();

const editing = ref(false);
const draftWord = ref(props.card.word);
const draftDefinition = ref(props.card.definition);

watch(
    () => props.card,
    (c) => {
        draftWord.value = c.word;
        draftDefinition.value = c.definition;
    },
);

const onSave = () => {
    emit('save', props.card.id, {
        word: draftWord.value.trim(),
        definition: draftDefinition.value.trim(),
    });
    editing.value = false;
};

const cancel = () => {
    draftWord.value = props.card.word;
    draftDefinition.value = props.card.definition;
    editing.value = false;
};
</script>
