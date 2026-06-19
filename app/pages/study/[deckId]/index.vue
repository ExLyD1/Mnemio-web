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
            <h1 v-if="store.deck" class="mt-3 break-words font-display text-display-sm text-cream">
                {{ store.deck.title }}
            </h1>
            <p class="mt-2 text-body text-cream-dim">{{ t('study.modePickerHint') }}</p>
            <p v-if="cardCount" class="mt-1 text-small text-brand-muted">
                {{ t('study.deckCardCount').replace('{n}', String(cardCount)) }}
                · {{ t('study.practiceSrsNote') }}
            </p>
        </header>

        <SharedPageLoader v-if="store.loadingDeck && !store.deck" />

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
                :meta="flashcardMeta"
                @select="navigateTo(`/study/${deckId}/flashcard`)"
            />
            <StudyModeCard
                :icon="ListChecks"
                :title="t('study.multipleChoiceTitle')"
                :description="t('study.multipleChoiceDescription')"
                :meta="multipleChoiceMeta"
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

useSeo({ title: t('seo.studyTitle'), description: t('seo.appDesc'), noindex: true });

const cardCount = computed(() => store.deck?.cards.length ?? 0);
const flashcardMeta = computed(() => {
    if (!cardCount.value) return undefined;
    const mins = Math.max(1, Math.ceil((cardCount.value * 10) / 60));
    return `${cardCount.value} ${t('study.cards')} · ~${mins} ${t('study.min')}`;
});
const multipleChoiceMeta = computed(() => {
    if (!cardCount.value) return undefined;
    const mins = Math.max(1, Math.ceil((cardCount.value * 15) / 60));
    return `${cardCount.value} ${t('study.cards')} · ~${mins} ${t('study.min')}`;
});

onMounted(() => {
    if (!store.deck || store.deck.id !== deckId.value) {
        fetchOne.execute(deckId.value);
    }
});
</script>
