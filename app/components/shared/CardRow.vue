<template>
    <div
        class="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-line hover:bg-brand/10"
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

        <div class="flex shrink-0 items-center gap-1">
            <button
                v-if="card.audioUrl"
                type="button"
                class="grid size-8 place-items-center rounded-full text-brand-muted transition-colors hover:text-cream"
                aria-label="Play audio"
                @click="playAudio"
            >
                <Volume2 class="size-4" />
            </button>
            <button
                type="button"
                class="grid size-8 place-items-center rounded-full text-brand-muted transition hover:text-cream sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Edit card"
                @click="$emit('edit', card.id)"
            >
                <Pencil class="size-4" />
            </button>
            <button
                type="button"
                class="grid size-8 place-items-center rounded-full text-brand-muted transition hover:text-error sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Delete card"
                @click="$emit('delete', card.id)"
            >
                <Trash2 class="size-4" />
            </button>
            <span
                :class="['inline-block size-2.5 rounded-full', dotClass]"
                role="img"
                :aria-label="`Status: ${stateLabel}`"
                :title="stateLabel"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { Volume2, Pencil, Trash2 } from 'lucide-vue-next';
import type { Card } from '@/types/deck';
import { mediaUrl } from '@/utils/media';

const props = defineProps<{
    index: number;
    card: Card;
    state: 'mastered' | 'learning' | 'new';
}>();

defineEmits<{ edit: [id: string]; delete: [id: string] }>();

const playAudio = () => {
    const url = mediaUrl(props.card.audioUrl);
    if (url) {
        void new Audio(url).play().catch(() => {});
    }
};

const dotClass = computed(
    () =>
        ({
            mastered: 'bg-lavender',
            learning: 'bg-brand',
            new: 'border border-brand-muted',
        })[props.state],
);

const stateLabel = computed(
    () =>
        ({
            mastered: 'Mastered',
            learning: 'Learning',
            new: 'New',
        })[props.state],
);
</script>
