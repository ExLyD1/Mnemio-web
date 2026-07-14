<template>
    <section class="flex h-screen flex-col">
        <header
            class="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 sm:h-[68px] sm:gap-4 sm:px-6"
        >
            <div class="flex min-w-0 items-center gap-3">
                <SharedBrandMark :with-word="false" size="sm" />
                <p
                    v-if="store.deck"
                    class="truncate font-display text-base leading-none text-cream"
                >
                    {{ store.deck.title }}
                </p>
            </div>
            <div class="flex flex-1 items-center justify-center gap-3">
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
                <UiButton variant="ghost" class="!py-2 !text-small" @click="onEnd">
                    {{ t('study.endSession') }}
                </UiButton>
            </div>
        </header>

        <main class="flex flex-1 flex-col items-center justify-center gap-5 p-4 sm:gap-8 sm:p-6">
            <SharedPageLoader v-if="loading" />

            <!-- Between-rounds overlay (track-progress mode, round finished, revisit > 0) -->
            <template v-else-if="roundDone">
                <div class="flex w-full max-w-sm flex-col items-center gap-6 text-center">
                    <div class="flex flex-col items-center gap-2">
                        <p class="font-display text-h2 text-cream">
                            {{ t('study.roundComplete') }}
                        </p>
                        <p class="text-body text-cream-dim">
                            {{
                                t('study.unknownCards').replace(
                                    '{n}',
                                    String(practice.revisitCards.value.length),
                                )
                            }}
                        </p>
                    </div>
                    <div class="flex flex-col gap-3 w-full">
                        <UiButton variant="primary" @click="studyUnknown">
                            {{ t('study.studyUnknown') }}
                        </UiButton>
                        <UiButton variant="ghost" @click="finalize">
                            {{ t('study.endSession') }}
                        </UiButton>
                    </div>
                </div>
            </template>

            <template
                v-else-if="
                    practice.study.state.value === 'active' && practice.study.currentCard.value
                "
            >
                <template v-if="mode !== 'multiple-choice' && studyCard">
                    <!-- Card row: side arrows on sm+, card takes full width on mobile -->
                    <div class="flex w-full items-center justify-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            class="hidden size-11 shrink-0 place-items-center rounded-full border border-line-strong text-brand-muted transition-colors hover:bg-brand/20 hover:text-cream disabled:cursor-not-allowed disabled:opacity-30 sm:grid"
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
                            class="hidden size-11 shrink-0 place-items-center rounded-full border border-line-strong text-brand-muted transition-colors hover:bg-brand/20 hover:text-cream disabled:cursor-not-allowed disabled:opacity-30 sm:grid"
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
                    <!-- Mobile-only arrow row: appears below the card -->
                    <div class="flex justify-center gap-8 sm:hidden">
                        <button
                            type="button"
                            class="grid size-11 place-items-center rounded-full border border-line-strong text-brand-muted transition-colors hover:bg-brand/20 hover:text-cream disabled:cursor-not-allowed disabled:opacity-30"
                            :aria-label="t('study.prevCard')"
                            :disabled="practice.study.currentIndex.value === 0"
                            @click="practice.goPrev"
                        >
                            <ChevronLeft class="size-5" />
                        </button>
                        <button
                            type="button"
                            class="grid size-11 place-items-center rounded-full border border-line-strong text-brand-muted transition-colors hover:bg-brand/20 hover:text-cream disabled:cursor-not-allowed disabled:opacity-30"
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
                            <p v-else class="hidden text-small text-brand-muted sm:block">
                                {{ t('study.revealHint') }}
                            </p>
                        </Transition>
                    </div>

                    <!-- Shuffle + Track-progress controls -->
                    <div class="flex items-center justify-center gap-4 sm:gap-6">
                        <button
                            type="button"
                            class="flex items-center gap-1.5 text-small text-brand-muted transition-colors hover:text-cream"
                            @click="onReshuffle"
                        >
                            <Shuffle class="size-3.5" />
                            {{ t('study.shuffleBtn') }}
                        </button>
                        <span class="h-3 w-px bg-line" aria-hidden="true" />
                        <label
                            class="flex cursor-pointer items-center gap-2 text-small text-brand-muted"
                        >
                            <button
                                type="button"
                                role="switch"
                                :aria-checked="trackProgress"
                                :aria-label="t('study.trackProgress')"
                                class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                :class="
                                    trackProgress
                                        ? 'border-brand bg-brand'
                                        : 'border-line bg-bg-surface-2'
                                "
                                @click="trackProgress = !trackProgress"
                            >
                                <span
                                    class="pointer-events-none inline-block h-3 w-3 transform rounded-full transition-transform"
                                    :class="
                                        trackProgress
                                            ? 'translate-x-[18px] bg-white'
                                            : 'translate-x-0.5 bg-brand-muted'
                                    "
                                />
                            </button>
                            <span :class="trackProgress ? 'text-cream' : ''">
                                {{ t('study.trackProgress') }}
                            </span>
                            <span class="group/tip relative inline-flex items-center">
                                <Info class="size-3.5 cursor-help text-brand-muted/50 transition-colors group-hover/tip:text-brand-muted" />
                                <span
                                    class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-xl bg-[#1a0d2e] px-3 py-2.5 text-center text-[11px] leading-relaxed text-white shadow-xl opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100"
                                >
                                    {{ t('study.trackProgressHint') }}
                                </span>
                            </span>
                        </label>
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
import { ChevronLeft, ChevronRight, Info, Shuffle } from 'lucide-vue-next';
import { useDecks, useT } from '#imports';
import { usePractice } from '@/composables/usePractice';
import { usePracticeStore } from '@/stores/practice';
import { useSessionsStore } from '@/stores/sessions';
import { useAchievements } from '@/composables/useAchievements';
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
const sessionsStore = useSessionsStore();

// SRS is on unless the mode picker sent ?srs=0.
const srsEnabled = route.query.srs !== '0';
const practice = usePractice({ srsEnabled });
const achievements = useAchievements();

useSeo({ title: t('seo.studyTitle'), description: t('seo.appDesc'), noindex: true });
const practiceStore = usePracticeStore();

const loading = ref(true);
// Track-progress mode: when true, a completed round shows a "study again" CTA
// instead of going to the results page (if there are revisit cards left).
const TRACK_KEY = 'mnemio_track_progress';
const trackProgress = ref(false);
// True when a round is done and we're waiting for the user to start the next.
const roundDone = ref(false);

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
    achievements.load().catch(() => {});
    navigateTo(`/study/${deckId.value}/results`);
};

// Start another round with only the not-yet-known cards.
const studyUnknown = async () => {
    if (!store.deck) return;
    const cards = [...practice.revisitCards.value];
    practice.resetCounts();
    roundDone.value = false;
    await practice.study.startWithCards(store.deck, mode.value, cards);
};

// Shuffle the current queue and jump back to card 0.
const onReshuffle = async () => {
    practice.revealed.value = false;
    await practice.study.reshuffle();
};

watch(
    () => practice.study.state.value,
    (state) => {
        if (state === 'results') {
            if (trackProgress.value && practice.revisitCards.value.length > 0) {
                // Stay on this page; user can loop over the unknown cards.
                roundDone.value = true;
            } else {
                finalize();
            }
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
    if (!deck) {
        loading.value = false;
        return;
    }

    // ?resume=1 → restore queue order and position from the persisted session.
    if (route.query.resume === '1') {
        const s = sessionsStore.active ?? sessionsStore.latestIncomplete;
        if (s && s.deckId === deckId.value) {
            await practice.study.resume(deck, s.id);
            loading.value = false;
            return;
        }
    }

    await practice.study.start(deck, mode.value);
    loading.value = false;
};

onMounted(() => {
    // Restore track-progress preference from localStorage.
    const saved = localStorage.getItem(TRACK_KEY);
    if (saved !== null) trackProgress.value = saved === 'true';
    startSession();
    window.addEventListener('keydown', onKey);
});

watch(trackProgress, (val) => {
    localStorage.setItem(TRACK_KEY, String(val));
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
    transform: translateX(24px);
}
.card-leave-to {
    opacity: 0;
    transform: translateX(-24px);
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
