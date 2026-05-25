<template>
    <NuxtLink
        :to="`/decks/${deck.id}`"
        class="group relative flex flex-col gap-3 rounded-2xl bg-bg-surface p-5 transition-colors hover:bg-bg-deep"
    >
        <div class="flex items-start justify-between gap-2">
            <h3 class="line-clamp-2 text-h3 font-bold text-neutral-0">{{ deck.title }}</h3>
            <div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                    type="button"
                    class="rounded-md p-1.5 text-brand-muted transition-colors hover:bg-bg-muted hover:text-brand-pale"
                    :aria-label="t('deck.edit')"
                    @click.prevent.stop="$emit('edit', deck.id)"
                >
                    <Pencil class="size-4" />
                </button>
                <button
                    type="button"
                    class="rounded-md p-1.5 text-brand-muted transition-colors hover:bg-bg-muted hover:text-error"
                    :aria-label="t('deck.delete')"
                    @click.prevent.stop="$emit('delete', deck.id)"
                >
                    <Trash2 class="size-4" />
                </button>
            </div>
        </div>

        <p v-if="deck.description" class="line-clamp-2 text-small text-brand-muted">
            {{ deck.description }}
        </p>

        <div class="mt-auto flex items-center justify-between gap-2 text-small text-brand-muted">
            <div class="flex items-center gap-1">
                <UiBadge variant="neutral">{{ deck.sourceLanguage.toUpperCase() }}</UiBadge>
                <span>→</span>
                <UiBadge variant="brand">{{ deck.targetLanguage.toUpperCase() }}</UiBadge>
            </div>
            <span>{{ t('deck.cardCount').replace('{n}', String(deck.cardCount)) }}</span>
        </div>
    </NuxtLink>
</template>

<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next';
import type { DeckSummary } from '@/types/deck';
import { useT } from '@/composables/useT';

defineProps<{ deck: DeckSummary }>();
defineEmits<{ edit: [id: string]; delete: [id: string] }>();

const { t } = useT();
</script>
