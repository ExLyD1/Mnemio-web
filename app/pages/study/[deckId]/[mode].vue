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
                    {{ practice.study.graduatedCount.value }}
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

            <template
                v-else-if="
                    practice.study.state.value === 'active' && practice.study.currentCard.value
                "
            >
                <template v-if="mode !== 'multiple-choice' && studyCard">
                    <!-- Card row: a "previous" look-back arrow on sm+, card takes
                         full width on mobile. There is deliberately no "next" —
                         skipping forward is what broke due-ordering before (#4);
                         the queue itself decides what comes next. -->
                    <div class="flex w-full items-center justify-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            class="hidden size-11 shrink-0 place-items-center rounded-full border border-line-strong text-brand-muted transition-colors hover:bg-brand/20 hover:text-cream disabled:cursor-not-allowed disabled:opacity-30 sm:grid"
                            :aria-label="t('study.prevCard')"
                            :disabled="
                                !practice.study.canGoPrev.value || practice.study.peeking.value
                            "
                            @click="practice.goPrev"
                        >
                            <ChevronLeft class="size-5" />
                        </button>
                        <Transition name="card" mode="out-in">
                            <StudyFlashCard
                                :key="studyCard.id"
                                :card="studyCard"
                                :revealed="
                                    practice.study.peeking.value ? true : practice.revealed.value
                                "
                                :front="frontSide"
                                @flip="onFlip"
                            />
                        </Transition>
                        <div class="hidden size-11 shrink-0 sm:block" aria-hidden="true" />
                    </div>
                    <!-- Mobile-only arrow row: appears below the card -->
                    <div class="flex justify-center gap-8 sm:hidden">
                        <button
                            type="button"
                            class="grid size-11 place-items-center rounded-full border border-line-strong text-brand-muted transition-colors hover:bg-brand/20 hover:text-cream disabled:cursor-not-allowed disabled:opacity-30"
                            :aria-label="t('study.prevCard')"
                            :disabled="
                                !practice.study.canGoPrev.value || practice.study.peeking.value
                            "
                            @click="practice.goPrev"
                        >
                            <ChevronLeft class="size-5" />
                        </button>
                    </div>
                    <div class="flex min-h-[72px] w-full items-center justify-center">
                        <Transition name="rate" mode="out-in">
                            <UiButton
                                v-if="practice.study.peeking.value"
                                variant="ghost"
                                @click="practice.study.resumeFromPeek"
                            >
                                {{ t('study.backToSession') }}
                            </UiButton>
                            <StudyRatingRow
                                v-else-if="practice.revealed.value && srsEnabled"
                                :previews="ratingPreviews"
                                @grade="onGrade"
                            />
                            <StudySimpleRatingRow
                                v-else-if="practice.revealed.value"
                                @answer="onSimpleAnswer"
                            />
                            <p v-else class="hidden text-small text-brand-muted sm:block">
                                {{ t('study.revealHint') }}
                            </p>
                        </Transition>
                    </div>

                    <!-- Shuffle + Track-progress + Front-side controls -->
                    <div class="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                        <label
                            for="study-shuffle-toggle"
                            class="flex cursor-pointer items-center gap-2 text-small text-brand-muted"
                        >
                            <button
                                id="study-shuffle-toggle"
                                type="button"
                                role="switch"
                                :aria-checked="shuffleEnabled"
                                :aria-label="t('study.shuffleBtn')"
                                class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                :class="
                                    shuffleEnabled
                                        ? 'border-brand bg-brand'
                                        : 'border-line bg-bg-surface-2'
                                "
                                @click="onToggleShuffle"
                            >
                                <span
                                    class="pointer-events-none inline-block h-3 w-3 transform rounded-full transition-transform"
                                    :class="
                                        shuffleEnabled
                                            ? 'translate-x-[18px] bg-on-plum'
                                            : 'translate-x-0.5 bg-brand-muted'
                                    "
                                />
                            </button>
                            <Shuffle class="size-3.5" />
                            <span :class="shuffleEnabled ? 'text-cream' : ''">
                                {{ t('study.shuffleBtn') }}
                            </span>
                        </label>
                        <span class="hidden h-3 w-px bg-line sm:block" aria-hidden="true" />
                        <label
                            for="study-track-progress-toggle"
                            class="flex cursor-pointer items-center gap-2 text-small text-brand-muted"
                        >
                            <button
                                id="study-track-progress-toggle"
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
                                            ? 'translate-x-[18px] bg-on-plum'
                                            : 'translate-x-0.5 bg-brand-muted'
                                    "
                                />
                            </button>
                            <span :class="trackProgress ? 'text-cream' : ''">
                                {{ t('study.trackProgress') }}
                            </span>
                            <span class="group/tip relative inline-flex items-center">
                                <Info
                                    class="size-3.5 cursor-help text-brand-muted/50 transition-colors group-hover/tip:text-brand-muted"
                                />
                                <span
                                    class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-xl bg-plum-deep px-3 py-2.5 text-center text-[11px] leading-relaxed text-on-color shadow-xl opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100"
                                >
                                    {{ t('study.trackProgressHint') }}
                                </span>
                            </span>
                        </label>
                        <span class="hidden h-3 w-px bg-line sm:block" aria-hidden="true" />
                        <label
                            for="study-front-side-toggle"
                            class="flex cursor-pointer items-center gap-2 text-small text-brand-muted"
                        >
                            <button
                                id="study-front-side-toggle"
                                type="button"
                                role="switch"
                                :aria-checked="frontSide === 'definition'"
                                :aria-label="t('study.frontSide')"
                                class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                :class="
                                    frontSide === 'definition'
                                        ? 'border-brand bg-brand'
                                        : 'border-line bg-bg-surface-2'
                                "
                                @click="onToggleFrontSide"
                            >
                                <span
                                    class="pointer-events-none inline-block h-3 w-3 transform rounded-full transition-transform"
                                    :class="
                                        frontSide === 'definition'
                                            ? 'translate-x-[18px] bg-on-plum'
                                            : 'translate-x-0.5 bg-brand-muted'
                                    "
                                />
                            </button>
                            <span>
                                {{
                                    frontSide === 'definition'
                                        ? t('study.frontSideDefinition')
                                        : t('study.frontSideTerm')
                                }}
                            </span>
                            <span class="group/tip relative inline-flex items-center">
                                <Info
                                    class="size-3.5 cursor-help text-brand-muted/50 transition-colors group-hover/tip:text-brand-muted"
                                />
                                <span
                                    class="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-xl bg-plum-deep px-3 py-2.5 text-center text-[11px] leading-relaxed text-on-color shadow-xl opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100"
                                >
                                    {{ t('study.frontSideHint') }}
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
            class="pointer-events-none fixed bottom-6 right-6"
        />
    </section>
</template>

<script setup lang="ts">
import { ChevronLeft, Info, Shuffle } from 'lucide-vue-next';
import { useDecks, useT } from '#imports';
import { usePractice } from '@/composables/usePractice';
import { usePracticeStore } from '@/stores/practice';
import { useSessionsStore } from '@/stores/sessions';
import { useSrsStore } from '@/stores/srs';
import { useRatingPreviews } from '@/composables/useRatingPreviews';
import { buildMultipleChoice } from '@/composables/useMultipleChoice';
import { toStudyCard, type FrontSide } from '@/utils/studyCard';
import { useAnalytics } from '@/composables/useAnalytics';
import type { StudyMode } from '@/types/session';
import type { SrsRating } from '@/types/srs';

definePageMeta({ layout: 'study' });

const route = useRoute();
const deckId = computed(() => String(route.params.deckId));
const mode = computed(() => String(route.params.mode) as StudyMode);

const { store, fetchOne } = useDecks();
const { t } = useT();
const sessionsStore = useSessionsStore();
const srs = useSrsStore();
const analytics = useAnalytics();

// SRS is on unless the mode picker sent ?srs=0.
const srsEnabled = route.query.srs !== '0';
const practice = usePractice({ srsEnabled });

useSeo({ title: t('seo.studyTitle'), description: t('seo.appDesc'), noindex: true });
const practiceStore = usePracticeStore();

const loading = ref(true);
// Track-progress mode: when true, the session can only finish once every
// lapsed card has graduated out of the relearning ladder; when false, it
// finishes after one pass (see useStudySession's requireGraduation).
const TRACK_KEY = 'mnemio_track_progress';
const trackProgress = ref(false);
// Shuffle toggle - persistent on/off, not a one-shot "shuffle now" action
// (that was the old design: a button that reshuffled once and gave no
// indication whether future cards would also be shuffled).
const SHUFFLE_KEY = 'mnemio_shuffle_enabled';
const shuffleEnabled = ref(true);
// Which side the unrevealed face shows: the term (word) or the definition
// (meaning). Global, like Shuffle — applies immediately, mid-session.
const FRONT_KEY = 'mnemio_front_side';
const frontSide = ref<FrontSide>('term');

const studyCard = computed(() => {
    const card = practice.study.currentCard.value;
    if (!card || !store.deck) {
        return null;
    }
    return toStudyCard(card, store.deck);
});

// useRatingPreviews must be invoked once at setup time (it calls useT/useI18n
// internally) — not lazily inside a computed, which could run outside the
// component's setup context.
const currentCardProgress = computed(() => {
    const card = practice.study.currentCard.value;
    return card ? srs.progress[card.id] : undefined;
});
const { previews: ratingPreviews } = useRatingPreviews(currentCardProgress);

const currentQuestion = computed(() => {
    const card = practice.study.currentCard.value;
    if (mode.value !== 'multiple-choice' || !card) {
        return null;
    }
    return buildMultipleChoice(card, practice.study.queue.value);
});

const onFlip = () => {
    if (practice.study.peeking.value) {
        return;
    }
    practice.flip();
};

const onGrade = (rating: SrsRating) => {
    const card = practice.study.currentCard.value;
    if (card) {
        practice.grade(rating, card);
    }
};

// Non-SRS (browse) mode: just two buttons, no SM-2 grading.
const onSimpleAnswer = (correct: boolean) => {
    const card = practice.study.currentCard.value;
    if (card) {
        practice.recordSimple(correct, card);
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
        correct: practice.study.correctCount.value,
        streak: practice.streak.value,
        timeMs: practice.study.elapsedMs.value,
        counts: { ...practice.counts },
        revisit: [...practice.revisit.value],
    });
    practice.mimi.say('done');
    navigateTo(`/study/${deckId.value}/results`);
};

// Toggle shuffle mode: turning it on re-shuffles immediately; turning it off
// restores the deck's original card order. The shuffle only affects the
// tiebreak order new/unseen cards are served in — cards already in the
// relearning ladder keep their due times either way.
const onToggleShuffle = async () => {
    shuffleEnabled.value = !shuffleEnabled.value;
    practice.revealed.value = false;
    if (shuffleEnabled.value) {
        await practice.study.reshuffle();
    } else if (store.deck) {
        const inPlay = new Set(practice.study.queue.value.map((c) => c.id));
        const original = store.deck.cards.filter((c) => inPlay.has(c.id));
        await practice.study.reorder(original);
    }
};

const onToggleFrontSide = () => {
    frontSide.value = frontSide.value === 'term' ? 'definition' : 'term';
    practice.revealed.value = false;
    analytics.track('study_front_side_changed', { front_side: frontSide.value });
};

watch(
    () => practice.study.state.value,
    (state) => {
        if (state === 'results') {
            finalize();
        }
    },
);

watch(trackProgress, (val) => {
    practice.study.requireGraduation.value = val;
});

const onKey = (e: KeyboardEvent) => {
    if (practice.study.state.value !== 'active' || mode.value === 'multiple-choice') {
        return;
    }
    if (practice.study.peeking.value) {
        if (e.key === 'Escape' || e.key === ' ') {
            e.preventDefault();
            practice.study.resumeFromPeek();
        }
        return;
    }
    if (e.key === ' ') {
        e.preventDefault();
        practice.flip();
        return;
    }
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        practice.goPrev();
        return;
    }
    if (practice.revealed.value) {
        if (!srsEnabled) {
            if (e.key === '1') {
                e.preventDefault();
                onSimpleAnswer(false);
            } else if (e.key === '2') {
                e.preventDefault();
                onSimpleAnswer(true);
            }
            return;
        }
        const map: Record<string, SrsRating> = {
            '1': 'again',
            '2': 'hard',
            '3': 'good',
            '4': 'easy',
        };
        const rating = map[e.key];
        if (rating) {
            e.preventDefault();
            onGrade(rating);
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
            practice.study.requireGraduation.value = trackProgress.value;
            loading.value = false;
            return;
        }
    }

    await practice.study.start(deck, mode.value, srsEnabled, shuffleEnabled.value);
    practice.study.requireGraduation.value = trackProgress.value;
    loading.value = false;
};

onMounted(() => {
    // Restore track-progress + shuffle + front-side preferences from localStorage.
    const saved = localStorage.getItem(TRACK_KEY);
    if (saved !== null) trackProgress.value = saved === 'true';
    const savedShuffle = localStorage.getItem(SHUFFLE_KEY);
    if (savedShuffle !== null) shuffleEnabled.value = savedShuffle === 'true';
    const savedFront = localStorage.getItem(FRONT_KEY);
    if (savedFront === 'term' || savedFront === 'definition') frontSide.value = savedFront;
    // Progress data for the rating-button previews (#3) — already fetched on
    // most entry paths (dashboard/review), but a direct /study/:id/:mode visit
    // may not have it yet.
    srs.fetchAll();
    startSession();
    window.addEventListener('keydown', onKey);
});

watch(trackProgress, (val) => {
    localStorage.setItem(TRACK_KEY, String(val));
});

watch(shuffleEnabled, (val) => {
    localStorage.setItem(SHUFFLE_KEY, String(val));
});

watch(frontSide, (val) => {
    localStorage.setItem(FRONT_KEY, val);
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
