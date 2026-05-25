<template>
    <UiModal
        :model-value="modelValue"
        :title="title"
        size="sm"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <p class="text-body text-brand-pale">{{ message }}</p>
        <template #footer>
            <UiButton variant="ghost" :disabled="loading" @click="cancel">
                {{ cancelLabel ?? t('common.cancel') }}
            </UiButton>
            <UiButton
                :variant="destructive ? 'primary' : 'light'"
                :disabled="loading"
                @click="confirm"
            >
                <UiSpinner v-if="loading" size="sm" class="mr-2" />
                {{ confirmLabel }}
            </UiButton>
        </template>
    </UiModal>
</template>

<script setup lang="ts">
import { useT } from '@/composables/useT';

const props = defineProps<{
    modelValue: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel?: string;
    destructive?: boolean;
    loading?: boolean;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    confirm: [];
    cancel: [];
}>();

const { t } = useT();

const cancel = () => {
    emit('cancel');
    emit('update:modelValue', false);
};

const confirm = () => emit('confirm');
</script>
