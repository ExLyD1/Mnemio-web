<template>
    <section class="flex min-h-screen flex-col">
        <header class="flex flex-wrap items-center gap-3 border-b border-line p-4 sm:px-6">
            <SharedBrandMark :with-word="false" size="sm" />
            <p class="min-w-0 flex-1 truncate font-display text-cream">
                {{ practice.deck.value?.title || t('seo.reviewTitle') }}
            </p>
            <button
                type="button"
                class="rounded-full border border-line-strong px-3 py-1.5 text-small text-cream"
                :disabled="practice.locked.value"
                @click="changeMode"
            >
                {{ t(mode === 'srs' ? 'practice.srs' : 'practice.know') }} ·
                {{ t('practice.change') }}
            </button>
            <UiButton
                variant="ghost"
                :disabled="practice.locked.value"
                @click="navigateTo(backPath)"
                >{{ t('study.endSession') }}</UiButton
            >
        </header>
        <main
            class="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 p-4 sm:p-6"
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
                    {{
                        t('study.unknownCards').replace(
                            '{n}',
                            String(practice.unknown.value.length),
                        )
                    }}
                </p>
                <UiButton @click="practice.nextRound">{{ t('study.studyUnknown') }}</UiButton>
                <UiButton variant="ghost" @click="showResults">{{
                    t('study.endSession')
                }}</UiButton>
            </template>
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
                    {{ t('practice.answerCount').replace('{n}', String(practice.answers.value)) }}
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
                <div
                    v-if="mode === 'srs'"
                    class="flex gap-5 text-small tabular-nums"
                    aria-live="polite"
                >
                    <span class="text-vib-blue"
                        >{{ t('practice.new') }} {{ practice.srs.counts.value.new }}</span
                    >
                    <span class="text-vib-amber"
                        >{{ t('practice.learning') }} {{ practice.srs.counts.value.learning }}</span
                    >
                    <span class="text-success"
                        >{{ t('practice.review') }} {{ practice.srs.counts.value.review }}</span
                    >
                </div>
                <p v-else class="text-small text-brand-muted">
                    {{ t('practice.remaining').replace('{n}', String(practice.remaining.value)) }}
                </p>
                <template v-if="format === 'flashcard'">
                    <StudyFlashCard
                        :key="studyCard.id"
                        :card="studyCard"
                        :revealed="practice.revealed.value"
                        @flip="flip"
                    />
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
                    <p v-else class="text-small text-brand-muted">{{ t('study.revealHint') }}</p>
                </template>
                <StudyMultipleChoiceCard
                    v-else-if="question"
                    :key="`${studyCard.id}:${practice.answers.value}`"
                    :question="question"
                    :disabled="practice.locked.value"
                    @answer="pendingCorrect = $event"
                    @next="nextChoice"
                />
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
    </section>
</template>

<script setup lang="ts">
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
const changeMode = () =>
    navigateTo(props.deckId ? `/study/${props.deckId}?pick=1` : '/review?pick=1');
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
