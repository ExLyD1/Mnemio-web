<template>
    <div class="flex flex-col gap-3">
        <UiEmptyState
            v-if="!cards.length"
            :title="t('card.emptyTitle')"
            :message="t('card.emptyMessage')"
        />
        <ul v-else class="flex flex-col gap-2">
            <CardItem
                v-for="card in cards"
                :key="card.id"
                :card="card"
                @save="(id, input) => $emit('save', id, input)"
                @delete="$emit('delete', $event)"
            />
        </ul>

        <div v-if="hasMore" class="flex justify-center">
            <UiButton variant="ghost" :disabled="loadingMore" @click="$emit('loadMore')">
                <UiSpinner v-if="loadingMore" size="sm" class="mr-2" />
                {{ t('common.loadMore') }}
            </UiButton>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Card } from '@/types/deck';
import { useT } from '@/composables/useT';

defineProps<{
    cards: Card[];
    hasMore?: boolean;
    loadingMore?: boolean;
}>();
defineEmits<{
    save: [id: string, input: { word: string; definition: string }];
    delete: [id: string];
    loadMore: [];
}>();

const { t } = useT();
</script>
