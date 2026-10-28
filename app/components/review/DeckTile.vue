<template>
    <div class="group relative">
        <button
            type="button"
            :aria-pressed="selecting ? selected : undefined"
            :class="[
                'flex w-full flex-col overflow-hidden rounded-2xl border bg-bg-surface text-left transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                selected
                    ? 'border-brand ring-2 ring-brand'
                    : 'border-line hover:-translate-y-0.5 hover:border-line-strong',
            ]"
            @click="selecting ? $emit('toggle') : $emit('open')"
        >
            <SharedCoverArt
                :swatch="deck.coverColor ?? swatchFor(deck.deckId)"
                :glyph="deck.glyph ?? ''"
                class="h-20 w-full !rounded-none sm:h-24"
            />
            <span class="flex flex-col gap-1 p-3">
                <span class="line-clamp-2 font-semibold leading-snug text-cream">
                    {{ deck.deckTitle }}
                </span>
                <span class="text-small tabular-nums text-brand-muted">
                    {{ t('review.dueCount', deck.due) }}
                </span>
            </span>
        </button>
        <!-- A separate focus target, so selecting never starts a review. -->
        <button
            type="button"
            role="checkbox"
            :aria-checked="selected"
            :aria-label="t('review.selectDeck').replace('{title}', deck.deckTitle)"
            :class="[
                'absolute right-2 top-2 grid size-8 place-items-center rounded-full border-2 transition',
                'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
                '[@media(hover:none)]:opacity-100',
                selected
                    ? 'border-brand bg-brand text-on-color opacity-100'
                    : 'border-on-color/80 bg-plum/40 text-transparent backdrop-blur-sm',
                selecting || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            ]"
            @click.stop="$emit('toggle')"
        >
            <Check class="size-4" :stroke-width="3" />
        </button>
    </div>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { swatchFor } from '@/utils/coverSwatches';
import type { SrsDeckDue } from '@/types/srs';

defineProps<{
    deck: SrsDeckDue;
    /** Multi-select is on: tapping the tile toggles it instead of starting. */
    selecting: boolean;
    selected: boolean;
}>();
defineEmits<{ open: []; toggle: [] }>();
const { t } = useT();
</script>
