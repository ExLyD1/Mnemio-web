<template>
    <section class="flex min-h-screen flex-col">
        <header
            class="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4 sm:h-[68px] sm:gap-4 sm:px-6"
        >
            <div class="flex min-w-0 items-center gap-3">
                <SharedBrandMark :with-word="false" size="sm" />
                <p class="truncate font-display text-base leading-none text-cream">
                    {{ deckId ? practice.deck.value?.title : t('review.heading') }}
                </p>
            </div>
            <div class="flex flex-1 items-center justify-center gap-3">
                <span v-if="studyCard" class="text-small tabular-nums text-brand-muted">
                    {{
                        t(
                            mode === 'srs' ? 'review.dueLeft' : 'practice.remaining',
                            practice.remaining.value,
                        )
                    }}
                </span>
            </div>
            <UiButton
                variant="ghost"
                class="!py-2 !text-small"
                :disabled="practice.locked.value"
                @click="navigateTo(deckId ? backPath : '/dashboard')"
            >
                {{ t('study.endSession') }}
            </UiButton>
        </header>
        <main
            class="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-5 p-4 sm:gap-8 sm:p-6"
        >
            <SharedPageLoader v-if="practice.loading.value" />
            <UiEmptyState
                v-else-if="practice.error.value"
                :title="t('study.couldNotStartTitle')"
                :message="practice.error.value"
            >
                <template #action
                    ><UiButton @click="practice.initialize()">{{
                        t('practice.retry')
                    }}</UiButton></template
                >
            </UiEmptyState>
            <template v-else-if="practice.roundDone.value">
                <SharedMimi mood="done" :size="110" />
                <h1 class="font-display text-h2 text-cream">{{ t('study.roundComplete') }}</h1>
                <p class="text-cream">
                    {{ t('study.unknownCards', practice.unknown.value.length) }}
                </p>
                <UiButton @click="practice.nextRound">{{ t('study.studyUnknown') }}</UiButton>
                <UiButton variant="ghost" @click="showResults">{{
                    t('study.endSession')
                }}</UiButton>
            </template>
            <!-- Global SRS review keeps the original /review results screen. -->
            <template v-else-if="reviewDone && practice.answers.value">
                <SharedMimi mood="done" :size="120" />
                <h1 class="font-display text-h1 text-cream">{{ t('review.resultsTitle') }}</h1>
                <p class="max-w-md text-body text-cream-dim">
                    {{ t('review.resultsSummary', practice.answers.value, { pct: accuracy }) }}
                </p>
                <div class="grid w-full max-w-md grid-cols-2 gap-3">
                    <SharedStatTile :label="t('study.reviewed')" :value="practice.answers.value" />
                    <SharedStatTile
                        :label="t('study.recalled')"
                        :value="`${accuracy}%`"
                        tone="accent"
                    />
                </div>
                <div
                    class="w-full max-w-md rounded-[20px] border border-line bg-bg-surface p-5 text-left"
                >
                    <p class="text-eyebrow uppercase text-brand-muted">
                        {{ t('study.howItWent') }}
                    </p>
                    <div class="mt-3">
                        <SharedBreakdownBar :segments="segments" />
                    </div>
                </div>
                <div class="flex flex-wrap items-center justify-center gap-3">
                    <UiButton
                        v-if="practice.srs.metadata.value?.newAvailable"
                        variant="ghost"
                        :disabled="practice.locked.value"
                        @click="practice.initialize(20)"
                        >{{ t('practice.extraNew') }}</UiButton
                    >
                    <UiButton variant="ghost" @click="navigateTo('/decks')">
                        {{ t('review.browseDecks') }}
                    </UiButton>
                    <UiButton variant="primary" @click="navigateTo('/dashboard')">
                        {{ t('review.backToDashboard') }}
                    </UiButton>
                </div>
            </template>
            <UiEmptyState
                v-else-if="reviewDone"
                :icon="CheckCheck"
                :title="t('review.allCaughtUpTitle')"
                :message="
                    nextReview
                        ? t('review.nextReviewAt').replace('{when}', nextReview)
                        : t('review.noProgressYet')
                "
            >
                <template #action>
                    <UiButton
                        v-if="practice.srs.metadata.value?.newAvailable"
                        variant="ghost"
                        :disabled="practice.locked.value"
                        @click="practice.initialize(20)"
                        >{{ t('practice.extraNew') }}</UiButton
                    >
                    <UiButton variant="primary" @click="navigateTo('/decks')">
                        {{ t('review.browseDecks') }}
                    </UiButton>
                </template>
            </UiEmptyState>
            <template v-else-if="practice.finished.value || !practice.current.value">
                <SharedMimi mood="done" :size="140" />
                <h1 class="font-display text-h2 text-cream">{{ t('practice.allDone') }}</h1>
                <p v-if="mode === 'srs' && nextReview" class="text-body text-cream">
                    {{ t('practice.nextReview').replace('{time}', nextReview) }}
                </p>
                <div v-if="mode === 'srs'" class="flex flex-wrap justify-center gap-3">
                    <UiButton
                        v-if="practice.srs.metadata.value?.newAvailable"
                        :disabled="practice.locked.value"
                        @click="practice.initialize(20)"
                        >{{ t('practice.extraNew') }}</UiButton
                    >
                    <UiButton variant="ghost" @click="practiceAnyway">{{
                        t('practice.anyway')
                    }}</UiButton>
                </div>
                <p v-if="practice.answers.value" class="text-small text-cream">
                    {{ t('practice.answerCount', practice.answers.value) }}
                </p>
                <UiButton
                    v-if="deckId && practice.answers.value"
                    variant="ghost"
                    @click="showResults"
                    >{{ t('practice.results') }}</UiButton
                >
                <UiButton v-if="!practice.finished.value" @click="practice.finish">{{
                    t('practice.retry')
                }}</UiButton>
                <UiButton @click="navigateTo(backPath)">{{
                    t(deckId ? 'study.backToDeck' : 'practice.backToDecks')
                }}</UiButton>
            </template>
            <template v-else-if="studyCard">
                <template v-if="format === 'flashcard'">
                    <div class="flex w-full items-center justify-center">
                        <div class="relative w-full max-w-3xl">
                            <Transition name="card" mode="out-in">
                                <StudyFlashCard
                                    :key="studyCard.id"
                                    :card="studyCard"
                                    :revealed="practice.revealed.value"
                                    :reserve-top-right="!deckId"
                                    @flip="flip"
                                />
                            </Transition>
                            <!-- Tip button — visible only when revealed -->
                            <button
                                v-if="!deckId && practice.revealed.value"
                                type="button"
                                class="absolute right-3 top-3 flex items-center gap-1.5 rounded-full border border-line-strong bg-bg-surface/80 px-3 py-1.5 text-small text-brand-muted backdrop-blur transition-colors hover:bg-bg-surface hover:text-cream"
                                @click="tipOpen = !tipOpen"
                            >
                                <Lightbulb class="size-3.5" />
                                {{ t('review.tip') }}
                            </button>
                        </div>
                    </div>
                    <div class="flex min-h-[72px] w-full items-center justify-center">
                        <Transition name="rate" mode="out-in">
                            <StudyRatingRow
                                v-if="practice.revealed.value && mode === 'srs'"
                                :previews="practice.srs.current.value?.previews"
                                :disabled="practice.locked.value"
                                @grade="practice.submit"
                            />
                            <StudySimpleRatingRow
                                v-else-if="practice.revealed.value"
                                :disabled="practice.locked.value"
                                @answer="simpleAnswer"
                            />
                            <p v-else class="hidden text-small text-brand-muted sm:block">
                                {{ t('study.revealHint') }}
                            </p>
                        </Transition>
                    </div>
                </template>
                <Transition v-else-if="question" name="card" mode="out-in">
                    <StudyMultipleChoiceCard
                        :key="`${studyCard.id}:${practice.answers.value}`"
                        :question="question"
                        :disabled="practice.locked.value"
                        @answer="pendingCorrect = $event"
                        @next="nextChoice"
                    />
                </Transition>
                <div
                    v-if="mode === 'know'"
                    class="flex flex-wrap justify-center gap-5 text-small text-cream"
                >
                    <label class="flex items-center gap-2"
                        ><input
                            type="checkbox"
                            :checked="practice.shuffleEnabled.value"
                            :disabled="practice.locked.value"
                            @change="practice.toggleShuffle"
                        />{{ t('study.shuffleBtn') }}</label
                    >
                    <label class="flex items-center gap-2"
                        ><input
                            v-model="practice.trackProgress.value"
                            type="checkbox"
                            :disabled="practice.locked.value"
                            @change="saveTrack"
                        />{{ t('study.trackProgress') }}</label
                    >
                </div>
            </template>
        </main>

        <!-- Docked tip panel: right drawer on desktop, bottom sheet on mobile -->
        <Transition name="tip-slide">
            <div
                v-if="tipOpen"
                class="fixed inset-x-0 bottom-0 z-30 flex max-h-[60vh] flex-col rounded-t-[24px] border-t border-line bg-bg-surface shadow-soft-elevation md:inset-x-auto md:inset-y-0 md:right-0 md:top-[68px] md:w-80 md:max-h-none md:rounded-none md:rounded-l-[24px] md:border-l md:border-t-0"
            >
                <div class="flex items-center justify-between border-b border-line px-5 py-4">
                    <div>
                        <p class="font-display text-base text-cream">{{ t('review.tipTitle') }}</p>
                        <p class="text-small text-brand-muted">{{ t('review.tipDisclaimer') }}</p>
                    </div>
                    <button
                        type="button"
                        class="grid size-8 place-items-center rounded-full text-brand-muted hover:text-cream"
                        @click="tipOpen = false"
                    >
                        <X class="size-4" />
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-5">
                    <div v-if="tipLoading" class="flex justify-center py-8">
                        <UiSpinner />
                    </div>
                    <p v-else-if="tipText" class="whitespace-pre-wrap text-body text-cream">
                        {{ tipText }}
                    </p>
                    <p v-else class="text-body text-brand-muted">{{ t('review.tipEmpty') }}</p>
                </div>
            </div>
        </Transition>
        <div
            v-if="tipOpen"
            class="fixed inset-0 z-20 bg-scrim md:hidden"
            @click="tipOpen = false"
        />
    </section>
</template>

<script setup lang="ts">
import { CheckCheck, Lightbulb, X } from 'lucide-vue-next';
import * as aiApi from '@/api/ai';
import { useQueuePractice } from '@/composables/useQueuePractice';
import { buildMultipleChoice } from '@/composables/useMultipleChoice';
import { toStudyCard } from '@/utils/studyCard';
import type { PracticeMode } from '@/types/srs';
import type { PracticeFormat } from '@/composables/usePracticePreferences';

const props = defineProps<{
    deckId?: string;
    mode: PracticeMode;
    format: PracticeFormat;
    resume?: boolean;
}>();
const { t } = useT();
const { current: locale } = useAppLocale();
const practice = useQueuePractice(props);
const backPath = computed(() => (props.deckId ? `/decks/${props.deckId}` : '/decks'));
const studyCard = computed(() =>
    practice.current.value ? toStudyCard(practice.current.value, practice.deck.value) : null,
);
const question = computed(() =>
    practice.current.value && props.format === 'multiple-choice'
        ? buildMultipleChoice(
              practice.current.value,
              practice.deck.value?.cards ?? practice.initialCards.value,
          )
        : null,
);
const pendingCorrect = ref<boolean | null>(null);
const nextReview = computed(() => {
    const date = practice.srs.nextDueAt.value;
    if (!date) return '';
    const minutes = Math.max(1, Math.ceil((Date.parse(date) - Date.now()) / 60000));
    const unit = minutes < 60 ? 'minute' : minutes < 1440 ? 'hour' : 'day';
    const amount =
        unit === 'minute'
            ? minutes
            : unit === 'hour'
              ? Math.ceil(minutes / 60)
              : Math.ceil(minutes / 1440);
    return new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }).format(amount, unit);
});
const reviewDone = computed(
    () =>
        !props.deckId &&
        props.mode === 'srs' &&
        (practice.finished.value || !practice.current.value),
);
const accuracy = computed(() => {
    const c = practice.counts;
    return practice.answers.value
        ? Math.round(((c.hard + c.good + c.easy) / practice.answers.value) * 100)
        : 0;
});
const segments = computed(() => [
    { label: t('study.unknown'), count: practice.counts.again, color: 'bg-error-soft' },
    { label: t('review.hard'), count: practice.counts.hard, color: 'bg-brand-bright' },
    { label: t('review.good'), count: practice.counts.good, color: 'bg-brand' },
    { label: t('review.easy'), count: practice.counts.easy, color: 'bg-success-bright' },
]);
const tipOpen = ref(false);
const tipLoading = ref(false);
const tipText = ref('');
watch(tipOpen, async (open) => {
    if (!open || tipText.value) return;
    tipLoading.value = true;
    try {
        tipText.value = (await aiApi.suggest('review', studyCard.value?.deckId)).suggestion;
    } catch {
        tipText.value = '';
    } finally {
        tipLoading.value = false;
    }
});
watch(
    () => studyCard.value?.id,
    () => {
        tipOpen.value = false;
        tipText.value = '';
    },
);
const flip = () => {
    if (!practice.locked.value) practice.revealed.value = !practice.revealed.value;
};
const simpleAnswer = (correct: boolean) => practice.submit(correct ? 'good' : 'again');
const nextChoice = async () => {
    if (pendingCorrect.value === null || practice.locked.value) return;
    const previousAnswers = practice.answers.value;
    await simpleAnswer(pendingCorrect.value);
    if (practice.answers.value !== previousAnswers) pendingCorrect.value = null;
};
const practiceAnyway = () =>
    navigateTo(
        props.deckId ? `/study/${props.deckId}/${props.format}?mode=know` : '/review?mode=know',
    );
const saveTrack = () =>
    localStorage.setItem('mnemio_track_progress', String(practice.trackProgress.value));
const showResults = () => {
    practice.saveResult();
    navigateTo(props.deckId ? `/study/${props.deckId}/results` : '/decks');
};
const onKey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (
        target?.closest('input, select, textarea, button, a, [contenteditable="true"]') ||
        event.repeat ||
        practice.locked.value ||
        practice.loading.value ||
        !practice.current.value ||
        practice.roundDone.value ||
        props.format !== 'flashcard'
    )
        return;
    if (event.key === ' ') {
        event.preventDefault();
        flip();
        return;
    }
    if (!practice.revealed.value) return;
    if (props.mode === 'know') {
        if (event.key === '1' || event.key === '2') {
            event.preventDefault();
            simpleAnswer(event.key === '2');
        }
    } else {
        const rating = (['again', 'hard', 'good', 'easy'] as const)[Number(event.key) - 1];
        if (rating) {
            event.preventDefault();
            practice.submit(rating);
        }
    }
};
// Await the exit so the server closes the session first, but never block leaving:
// a failed save must not trap the user on the page (exit() already toasts it).
const leave = async () => {
    await practice.exit();
};
onBeforeRouteLeave(leave);
// Query-only mode switches keep the page instance; exit before its keyed child is replaced.
onBeforeRouteUpdate(leave);
onMounted(() => {
    practice.initialize();
    window.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
/* Card X-axis transition */
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

/* Rating row fade transition */
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

/* Mobile: slide up from bottom */
.tip-slide-enter-active,
.tip-slide-leave-active {
    transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.tip-slide-enter-from,
.tip-slide-leave-to {
    transform: translateY(100%);
}
@media (min-width: 768px) {
    /* Desktop: slide in from right */
    .tip-slide-enter-from,
    .tip-slide-leave-to {
        transform: translateX(100%);
    }
}
</style>
