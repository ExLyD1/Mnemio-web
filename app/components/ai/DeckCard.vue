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
                {{ summary }}
            </span>
            <span v-if="skippedCount" class="block text-small text-brand-muted">
                {{ t('chat.deckSkipped').replace('{n}', String(skippedCount)) }}
            </span>
        </span>
        <span class="flex shrink-0 items-center gap-1 text-small text-brand-pale">
            {{ t('chat.openDeck') }} <ArrowRight class="size-4" />
        </span>
    </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Layers, ArrowRight } from 'lucide-vue-next';
import { useT } from '@/composables/useT';

/**
 * The receipt for a deck the assistant just wrote to. It carries what actually
 * happened — which deck, how many cards were added, how many were skipped as
 * duplicates, and the language pair — because the reply text alone ("Done! I've
 * added them to your deck") left users unable to tell where the cards went.
 */
const props = defineProps<{
    deckId: string;
    title: string;
    /** The deck's total after the write. */
    cardCount: number;
    action?: 'created' | 'appended';
    addedCount?: number;
    skippedCount?: number;
    sourceLanguage?: string;
    targetLanguage?: string;
}>();

const { t } = useT();

const pair = computed(() =>
    props.targetLanguage && props.sourceLanguage
        ? `${props.targetLanguage.toUpperCase()} → ${props.sourceLanguage.toUpperCase()}`
        : '',
);

const summary = computed(() => {
    const total = t('deck.cardCount').replace('{n}', String(props.cardCount));
    const added =
        props.action === 'appended' && props.addedCount
            ? t('chat.deckAdded').replace('{n}', String(props.addedCount))
            : '';
    return [added, total, pair.value].filter(Boolean).join(' · ');
});
</script>
