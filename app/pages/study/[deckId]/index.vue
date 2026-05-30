<template>
    <section class="mx-auto flex max-w-3xl flex-col gap-8 p-6">
        <header>
            <button
                type="button"
                class="flex items-center gap-1.5 text-small text-cream-dim transition-colors hover:text-cream"
                @click="navigateTo(`/decks/${deckId}`)"
            >
                <ArrowLeft class="size-4" />
                {{ t('study.backToDeck') }}
            </button>
            <h1 v-if="store.deck" class="mt-3 font-display text-display-sm text-cream">
                {{ store.deck.title }}
            </h1>
            <p class="mt-2 text-body text-cream-dim">{{ t('study.modePickerHint') }}</p>
        </header>

        <div v-if="store.loadingDeck && !store.deck" class="flex justify-center py-12">
            <UiSpinner size="lg" />
        </div>

        <UiEmptyState
            v-else-if="!store.deck"
            :title="t('deck.notFoundTitle')"
            :message="t('deck.notFoundMessage')"
        >
            <template #action>
                <UiButton variant="primary" @click="navigateTo('/decks')">
                    {{ t('deck.backToDecks') }}
                </UiButton>
            </template>
        </UiEmptyState>

        <UiEmptyState
            v-else-if="store.deck.cards.length === 0"
            :title="t('study.emptyDeckTitle')"
            :message="t('study.emptyDeckMessage')"
        >
            <template #action>
                <UiButton variant="primary" @click="navigateTo(`/decks/${deckId}`)">
                    {{ t('card.add') }}
                </UiButton>
            </template>
        </UiEmptyState>

        <div v-else class="grid gap-4 sm:grid-cols-2">
            <StudyModeCard
                :icon="Layers"
                :title="t('study.flashcardTitle')"
                :description="t('study.flashcardDescription')"
                @select="navigateTo(`/study/${deckId}/flashcard`)"
            />
            <StudyModeCard
                :icon="ListChecks"
                :title="t('study.multipleChoiceTitle')"
                :description="t('study.multipleChoiceDescription')"
                @select="navigateTo(`/study/${deckId}/multiple-choice`)"
            />
        </div>
    </section>
</template>

<script setup lang="ts">
import { ArrowLeft, Layers, ListChecks } from 'lucide-vue-next';
import { useDecks, useT } from '#imports';

definePageMeta({ layout: 'default' });

const route = useRoute();
const deckId = computed(() => String(route.params.deckId));

const { store, fetchOne } = useDecks();
const { t } = useT();

onMounted(() => {
    if (!store.deck || store.deck.id !== deckId.value) {
        fetchOne.execute(deckId.value);
    }
});
</script>
