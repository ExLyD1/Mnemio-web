<template>
    <NuxtLink
        :to="`/decks/${deckId}`"
        class="mt-2 flex items-center gap-3 rounded-2xl border border-line-strong bg-bg-surface-2 p-3 transition-colors hover:border-brand-bright hover:bg-brand/10"
    >
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/30 text-lavender">
            <Layers class="size-5" />
        </span>
        <span class="min-w-0 flex-1">
            <span class="block truncate font-display text-h3 text-cream">{{ title }}</span>
            <span class="block text-small text-brand-muted">
                {{ t('deck.cardCount').replace('{n}', String(cardCount)) }}
            </span>
        </span>
        <span class="flex shrink-0 items-center gap-1 text-small text-brand-pale">
            {{ t('chat.openDeck') }} <ArrowRight class="size-4" />
        </span>
    </NuxtLink>
</template>

<script setup lang="ts">
import { Layers, ArrowRight } from 'lucide-vue-next';
import { useT } from '@/composables/useT';

defineProps<{ deckId: string; title: string; cardCount: number }>();

const { t } = useT();
</script>
