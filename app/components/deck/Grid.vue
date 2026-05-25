<template>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DeckCard
            v-for="deck in decks"
            :key="deck.id"
            :deck="deck"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
        />
    </div>
</template>

<script setup lang="ts">
import type { DeckSummary } from '@/types/deck';

defineProps<{ decks: DeckSummary[] }>();
defineEmits<{ edit: [id: string]; delete: [id: string] }>();
</script>
