<template>
    <section class="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl flex-col gap-8 p-6">
        <div v-if="loading" class="flex flex-1 items-center justify-center">
            <UiSpinner size="lg" />
        </div>

        <template v-else-if="study.state.value === 'active' && study.currentCard.value">
            <StudyProgress
                :index="study.currentIndex.value"
                :total="study.totalCount.value"
                :elapsed-ms="study.elapsedMs.value"
                @exit="confirmExit = true"
            />

            <main class="flex flex-1 flex-col items-center justify-center gap-8">
                <StudyFlashCard
                    v-if="mode === 'flashcard'"
                    :card="study.currentCard.value"
                    :flipped="flipped"
                    @flip="flipped = !flipped"
                />
                <StudyMultipleChoiceCard
                    v-else-if="mode === 'multiple-choice' && currentQuestion"
                    :question="currentQuestion"
                    @answer="onMcAnswer"
                    @next="nextCard"
                />

                <StudyFlashCardActions
                    v-if="mode === 'flashcard'"
                    :flipped="flipped"
                    @answer="onFlashAnswer"
                />
            </main>
        </template>

        <UiEmptyState
            v-else-if="study.state.value === 'paused'"
            :title="t('study.pausedTitle')"
            :message="t('study.pausedMessage')"
        >
            <template #action>
                <UiButton variant="primary" @click="navigateTo(`/decks/${deckId}`)">
                    {{ t('study.backToDeck') }}
                </UiButton>
            </template>
        </UiEmptyState>

        <UiEmptyState
            v-else-if="study.error.value"
            :title="t('study.errorTitle')"
            :message="t(study.error.value, study.error.value)"
        >
            <template #action>
                <UiButton variant="primary" @click="navigateTo(`/decks/${deckId}`)">
                    {{ t('study.backToDeck') }}
                </UiButton>
            </template>
        </UiEmptyState>

        <UiConfirmDialog
            v-model="confirmExit"
            :title="t('study.exitTitle')"
            :message="t('study.exitMessage')"
            :confirm-label="t('study.exit')"
            destructive
            @confirm="onExit"
        />
    </section>
</template>

<script setup lang="ts">
import { useDecks, useT } from '#imports';
import { useStudySession } from '@/composables/useStudySession';
import { buildMultipleChoice } from '@/composables/useMultipleChoice';
import type { StudyMode } from '@/types/session';

definePageMeta({ layout: 'default' });

const route = useRoute();
const deckId = computed(() => String(route.params.deckId));
const mode = computed(() => String(route.params.mode) as StudyMode);

const { store, fetchOne } = useDecks();
const { t } = useT();
const study = useStudySession();

const loading = ref(true);
const flipped = ref(false);
const confirmExit = ref(false);

const currentQuestion = computed(() => {
    if (mode.value !== 'multiple-choice' || !study.currentCard.value) return null;
    return buildMultipleChoice(study.currentCard.value, study.queue.value);
});

const onFlashAnswer = async (correct: boolean) => {
    flipped.value = false;
    await study.answer(correct);
    if (study.state.value === 'results') {
        await navigateTo(`/study/${deckId.value}/results`);
    }
};

const onMcAnswer = async (correct: boolean) => {
    await study.answer(correct);
};

const nextCard = async () => {
    if (study.state.value === 'results') {
        await navigateTo(`/study/${deckId.value}/results`);
    }
};

const onExit = async () => {
    await study.exit();
    confirmExit.value = false;
    await navigateTo(`/decks/${deckId.value}`);
};

const startSession = async () => {
    loading.value = true;
    let deck = store.deck;
    if (!deck || deck.id !== deckId.value) {
        await fetchOne.execute(deckId.value);
        deck = store.deck;
    }
    if (!deck) {
        loading.value = false;
        return;
    }
    flipped.value = false;
    await study.start(deck, mode.value);
    loading.value = false;
};

const onKey = (e: KeyboardEvent) => {
    if (mode.value !== 'flashcard' || study.state.value !== 'active') return;
    if (e.key === ' ') {
        e.preventDefault();
        flipped.value = !flipped.value;
    } else if (flipped.value && (e.key === '1' || e.key === '2')) {
        e.preventDefault();
        onFlashAnswer(e.key === '2');
    }
};

onMounted(() => {
    startSession();
    window.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey);
});
</script>
