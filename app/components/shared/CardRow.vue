<template>
    <div
        class="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-line hover:bg-white/[0.02]"
    >
        <span class="w-6 shrink-0 text-right text-small text-brand-muted/70">{{ index }}</span>
        <div class="min-w-0 flex-1">
            <p class="truncate font-display text-base text-cream">{{ card.word }}</p>
            <p v-if="card.phonetic" class="truncate text-small text-brand-muted">
                {{ card.phonetic }}
            </p>
        </div>
        <p class="hidden min-w-0 flex-1 truncate text-small text-brand-muted sm:block">
            {{ card.definition }}
        </p>
        <UiTooltip content="Audio coming soon" side="left">
            <button
                type="button"
                disabled
                class="grid size-8 place-items-center rounded-full text-brand-muted/50"
                aria-label="Play audio"
            >
                <Volume2 class="size-4" />
            </button>
        </UiTooltip>
        <span :class="['size-2.5 shrink-0 rounded-full', dotClass]" :title="state" />
    </div>
</template>

<script setup lang="ts">
import { Volume2 } from 'lucide-vue-next';
import type { Card } from '@/types/deck';

const props = defineProps<{
    index: number;
    card: Card;
    state: 'mastered' | 'learning' | 'new';
}>();

const dotClass = computed(
    () =>
        ({
            mastered: 'bg-lavender',
            learning: 'bg-brand',
            new: 'border border-brand-muted',
        })[props.state],
);
</script>
