<template>
    <section class="flex h-screen flex-col">
        <header class="flex h-[68px] shrink-0 items-center gap-4 border-b border-line px-6">
            <div class="flex items-center gap-3">
                <SharedBrandMark :with-word="false" size="sm" />
                <p v-if="store.deck" class="font-display text-base leading-none text-cream">
                    {{ store.deck.title }}
                </p>
            </div>
            <div class="flex flex-1 items-center justify-center gap-3">
                <StudyProgressDots
                    :index="practice.study.currentIndex.value"
                    :total="practice.study.totalCount.value"
                />
                <span class="text-small tabular-nums text-brand-muted">
                    {{
                        Math.min(
                            practice.study.currentIndex.value + 1,
                            practice.study.totalCount.value,
                        )
                    }}
                    / {{ practice.study.totalCount.value }}
                </span>
            </div>
            <div class="flex items-center gap-3">
                <span class="hidden text-small text-brand-muted sm:inline">{{
                    reviewedLabel
                }}</span>
                <UiButton variant="ghost" class="!py-2 !text-small" @click="onEnd">
                    {{ t('study.endSession') }}
                </UiButton>
            </div>
        </header>

        <main class="flex flex-1 flex-col items-center justify-center gap-8 p-6">
            <SharedPageLoader v-if="loading" />

            <template
                v-else-if="
                    practice.study.state.value === 'active' && practice.study.currentCard.value
                "
            >
                <template v-if="mode !== 'multiple-choice' && studyCard">
                    <div class="flex w-full items-center justify-center gap-3">
                        <button
                            type="button"
                            class="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong text-brand-muted transition-colors hover:bg-brand/20 hover:text-cream disabled:cursor-not-allowed disabled:opacity-30"
                            :aria-label="t('study.prevCard')"
                            :disabled="practice.study.currentIndex.value === 0"
                            @click="practice.goPrev"
                        >
                            <ChevronLeft class="size-5" />
                        </button>
                        <Transition name="card" mode="out-in">
                            <StudyFlashCard
                                :key="studyCard.id"
                                :card="studyCard"
                                :revealed="practice.revealed.value"
                                @flip="practice.flip"
                            />
                        </Transition>
                        <button
                            type="button"
                            class="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong text-brand-muted transition-colors hover:bg-brand/20 hover:text-cream disabled:cursor-not-allowed disabled:opacity-30"
                            :aria-label="t('study.nextCard')"
                            :disabled="
                                practice.study.currentIndex.value >=
                                practice.study.totalCount.value - 1
                            "
                            @click="practice.goNext"
                        >
                            <ChevronRight class="size-5" />
                        </button>
                    </div>
                    <div class="flex min-h-[72px] w-full items-center justify-center">
                        <Transition name="rate" mode="out-in">
                            <StudyRatingRow v-if="practice.revealed.value" @grade="onGrade" />
                            <p v-else class="text-small text-brand-muted">
                                {{ t('study.revealHint') }}
                            </p>
                        </Transition>
                    </div>
                </template>

                <Transition v-else-if="currentQuestion" name="card" mode="out-in">
                    <StudyMultipleChoiceCard
                        :key="practice.study.currentCard.value?.id"
                        :question="currentQuestion"
                        @answer="onMcPick"
                        @next="onMcNext"
                    />
                </Transition>
            </template>

            <UiEmptyState
                v-else-if="practice.study.error.value"
                :title="t('study.couldNotStartTitle')"
                :message="t(practice.study.error.value, practice.study.error.value)"
            >
                <template #action>
                    <UiButton variant="primary" @click="navigateTo(`/decks/${deckId}`)">
                        {{ t('study.backToDeck') }}
                    </UiButton>
                </template>
            </UiEmptyState>
        </main>

        <SharedMimi
            v-if="practice.mimi.message.value"
            :message="practice.mimi.message.value"
            :mood="practice.mimi.mood.value"
            placement="right"
            :size="92"
            class="fixed bottom-6 right-6"
        />
    </section>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { useDecks, useT } from '#imports';
import { usePractice } from '@/composables/usePractice';
import { usePracticeStore } from '@/stores/practice';
import { buildMultipleChoice } from '@/composables/useMultipleChoice';
import { toStudyCard } from '@/utils/studyCard';
import { GRADES } from '@/utils/grades';
import type { StudyMode } from '@/types/session';
import type { SrsRating } from '@/types/srs';

definePageMeta({ layout: 'study' });

const route = useRoute();
const deckId = computed(() => String(route.params.deckId));
const mode = computed(() => String(route.params.mode) as StudyMode);

const { store, fetchOne } = useDecks();
const { t } = useT();
const practice = usePractice();

useSeo({ title: t('seo.studyTitle'), description: t('seo.appDesc'), noindex: true });
const practiceStore = usePracticeStore();

const loading = ref(true);

const studyCard = computed(() => {
    const card = practice.study.currentCard.value;
    if (!card || !store.deck) {
        return null;
    }
    return toStudyCard(card, store.deck);
});

const currentQuestion = computed(() => {
    const card = practice.study.currentCard.value;
    if (mode.value !== 'multiple-choice' || !card) {
        return null;
    }
    return buildMultipleChoice(card, practice.study.queue.value);
});

const reviewedLabel = computed(() =>
    t('study.reviewedSummary')
        .replace('{recalled}', String(practice.counts.good + practice.counts.easy))
        .replace('{revisit}', String(practice.revisit.value.length)),
);

const onGrade = (rating: SrsRating) => {
    const card = practice.study.currentCard.value;
    if (card) {
        practice.grade(rating, card);
    }
};

const mcPendingCorrect = ref<boolean | null>(null);

const onMcPick = (correct: boolean) => {
    mcPendingCorrect.value = correct;
};

const onMcNext = () => {
    const card = practice.study.currentCard.value;
    if (card && mcPendingCorrect.value !== null) {
        practice.recordSimple(mcPendingCorrect.value, card);
        mcPendingCorrect.value = null;
    }
};

const onEnd = async () => {
    await practice.study.exit();
    await navigateTo(`/decks/${deckId.value}`);
};

const finalize = () => {
    if (!store.deck) {
        return;
    }
    practiceStore.setResult({
        deckId: deckId.value,
        deckTitle: store.deck.title,
        reviewed: practice.study.totalCount.value,
        correct: practice.counts.good + practice.counts.easy,
        streak: practice.streak.value,
        timeMs: practice.study.elapsedMs.value,
        counts: { ...practice.counts },
        revisit: [...practice.revisit.value],
    });
    practice.mimi.say('done');
    navigateTo(`/study/${deckId.value}/results`);
};

watch(
    () => practice.study.state.value,
    (state) => {
        if (state === 'results') {
            finalize();
        }
    },
);

const onKey = (e: KeyboardEvent) => {
    if (practice.study.state.value !== 'active' || mode.value === 'multiple-choice') {
        return;
    }
    if (e.key === ' ') {
        e.preventDefault();
        practice.flip();
        return;
    }
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        practice.goNext();
        return;
    }
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        practice.goPrev();
        return;
    }
    if (practice.revealed.value) {
        const idx = ['1', '2', '3', '4'].indexOf(e.key);
        const grade = GRADES[idx];
        if (grade) {
            e.preventDefault();
            onGrade(grade.key);
        }
    }
};

const startSession = async () => {
    loading.value = true;
    let deck = store.deck;
    if (!deck || deck.id !== deckId.value) {
        await fetchOne.execute(deckId.value);
        deck = store.deck;
    }
    if (deck) {
        await practice.study.start(deck, mode.value);
    }
    loading.value = false;
};

onMounted(() => {
    startSession();
    window.addEventListener('keydown', onKey);
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey);
});
</script>

<style scoped>
.card-enter-active,
.card-leave-active {
    transition:
        opacity 0.25s ease,
        transform 0.25s ease;
}
.card-enter-from {
    opacity: 0;
    transform: translateY(10px);
}
.card-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
.rate-enter-active {
    transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1) 0.15s;
}
.rate-leave-active {
    transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.rate-enter-from,
.rate-leave-to {
    opacity: 0;
}
</style>
