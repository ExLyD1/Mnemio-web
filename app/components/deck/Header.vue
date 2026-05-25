<template>
    <header class="flex flex-col gap-4 rounded-2xl bg-bg-surface p-6">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex flex-col gap-2">
                <h1 class="text-h1 font-bold text-neutral-0">{{ deck.title }}</h1>
                <p v-if="deck.description" class="max-w-2xl text-body text-brand-muted">
                    {{ deck.description }}
                </p>
                <div class="flex items-center gap-2 text-small text-brand-muted">
                    <UiBadge variant="neutral">{{ deck.sourceLanguage.toUpperCase() }}</UiBadge>
                    <span>→</span>
                    <UiBadge variant="brand">{{ deck.targetLanguage.toUpperCase() }}</UiBadge>
                    <span class="ml-3">
                        {{ t('deck.cardCount').replace('{n}', String(deck.cards.length)) }}
                    </span>
                </div>
            </div>

            <div class="flex flex-wrap gap-2">
                <UiButton
                    variant="light"
                    :disabled="deck.cards.length === 0"
                    @click="$emit('study')"
                >
                    {{ t('deck.study') }}
                </UiButton>
                <UiButton variant="ghost" @click="$emit('edit')">
                    {{ t('deck.edit') }}
                </UiButton>
                <UiButton variant="ghost" @click="$emit('delete')">
                    {{ t('deck.delete') }}
                </UiButton>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import type { Deck } from '@/types/deck';
import { useT } from '@/composables/useT';

defineProps<{ deck: Deck }>();
defineEmits<{ study: []; edit: []; delete: [] }>();

const { t } = useT();
</script>
