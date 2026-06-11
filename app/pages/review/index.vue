<template>
    <section class="flex h-screen flex-col">
        <header class="flex h-[68px] shrink-0 items-center gap-4 border-b border-line px-6">
            <div class="flex items-center gap-3">
                <SharedBrandMark :with-word="false" size="sm" />
                <p class="font-display text-base leading-none text-cream">
                    {{ t('review.heading') }}
                </p>
            </div>
            <div v-if="active" class="flex flex-1 items-center justify-center gap-3">
                <StudyProgressDots :index="completedCount" :total="totalQueue" />
                <span class="text-small tabular-nums text-brand-muted">
                    {{ t('review.dueLeft').replace('{n}', String(srs.dueCount)) }}
                </span>
            </div>
            <div v-else class="flex-1" />
            <UiButton variant="ghost" class="!py-2 !text-small" @click="navigateTo('/dashboard')">
                {{ active ? t('study.endSession') : t('common.back') }}
            </UiButton>
        </header>

        <main class="flex flex-1 flex-col items-center justify-center gap-8 p-6">
            <SharedPageLoader v-if="srs.loading && !srs.dueCards.length" />

            <template v-else-if="active && studyCard">
                <StudyFlashCard
                    :card="studyCard"
                    :revealed="revealed"
                    @flip="revealed = !revealed"
                />
                <StudyRatingRow v-if="revealed" @grade="onRate" />
                <p v-else class="text-small text-brand-muted">
                    {{ t('review.flipHint') }}
                </p>
            </template>

            <template v-else-if="finished">
                <SharedMimi mood="done" :size="120" />
                <h1 class="font-display text-h1 text-cream">{{ t('review.resultsTitle') }}</h1>
                <p class="max-w-md text-body text-cream-dim">
                    {{
                        t('review.resultsSummary')
                            .replace('{n}', String(reviewedTotal))
                            .replace('{pct}', String(accuracy))
                    }}
                </p>
                <div class="grid w-full max-w-md grid-cols-2 gap-3">
                    <SharedStatTile :label="t('study.reviewed')" :value="reviewedTotal" />
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
                    <UiButton variant="ghost" @click="navigateTo('/decks')">
                        {{ t('review.browseDecks') }}
                    </UiButton>
                    <UiButton variant="primary" @click="navigateTo('/dashboard')">
                        {{ t('review.backToDashboard') }}
                    </UiButton>
                </div>
            </template>

            <UiEmptyState
                v-else-if="srs.dueCount === 0"
                :icon="CheckCheck"
                :title="t('review.allCaughtUpTitle')"
                :message="
                    srs.nextReviewAt
                        ? t('review.nextReviewAt').replace('{when}', formatNext(srs.nextReviewAt))
                        : t('review.noProgressYet')
                "
            >
                <template #action>
                    <UiButton variant="primary" @click="navigateTo('/decks')">
                        {{ t('review.browseDecks') }}
                    </UiButton>
                </template>
            </UiEmptyState>

            <div v-else class="flex flex-col items-center gap-5 text-center">
                <SharedMimi :size="120" />
                <h1 class="font-display text-h1 text-cream">{{ t('review.readyTitle') }}</h1>
                <p class="max-w-md text-body text-cream-dim">
                    {{ t('review.readyMessage').replace('{n}', String(srs.dueCount)) }}
                </p>
                <UiButton variant="primary" @click="startReview">
                    {{ t('review.startReview') }}
                </UiButton>
            </div>
        </main>

        <SharedMimi
            v-if="active && mimi.message.value"
            :message="mimi.message.value"
            :mood="mimi.mood.value"
            placement="right"
            :size="92"
            class="fixed bottom-6 right-6"
        />
    </section>
</template>

<script setup lang="ts">
import { CheckCheck } from 'lucide-vue-next';
import { useSrsStore, useToast, useT } from '#imports';
import { useMimi } from '@/composables/useMimi';
import type { SrsRating } from '@/types/srs';
import type { StudyCard } from '@/utils/studyCard';

definePageMeta({ layout: 'study' });

const srs = useSrsStore();
const toast = useToast();
const { t } = useT();
const mimi = useMimi();

useSeo({ title: t('seo.reviewTitle'), description: t('seo.appDesc'), noindex: true });

const active = ref(false);
const revealed = ref(false);
const completedCount = ref(0);
const totalQueue = ref(0);
const finished = ref(false);
const counts = reactive({ again: 0, hard: 0, good: 0, easy: 0 });

const currentDue = computed(() => srs.dueCards[0] ?? null);

const reviewedTotal = computed(() => completedCount.value);
const accuracy = computed(() =>
    reviewedTotal.value ? Math.round(((counts.good + counts.easy) / reviewedTotal.value) * 100) : 0,
);
const segments = computed(() => [
    { label: t('study.unknown'), count: counts.again, color: 'bg-error-soft' },
    { label: t('review.hard'), count: counts.hard, color: 'bg-brand-bright' },
    { label: t('review.good'), count: counts.good, color: 'bg-brand' },
    { label: t('review.easy'), count: counts.easy, color: 'bg-success-bright' },
]);

const studyCard = computed<StudyCard | null>(() => {
    const d = currentDue.value;
    if (!d) {
        return null;
    }
    return {
        id: d.card.id,
        deckId: d.card.deckId,
        word: d.card.word,
        reading: d.card.phonetic,
        meaning: d.card.definition,
        lang: d.deckTitle,
        region: '',
        pos: d.card.partOfSpeech ?? '',
        example: d.card.example ?? '',
        exampleTranslation: d.card.exampleTranslation ?? '',
    };
});

const startReview = () => {
    completedCount.value = 0;
    totalQueue.value = srs.dueCount;
    revealed.value = false;
    active.value = true;
    finished.value = false;
    counts.again = 0;
    counts.hard = 0;
    counts.good = 0;
    counts.easy = 0;
    mimi.say('idle');
};

const onRate = async (rating: SrsRating) => {
    const due = currentDue.value;
    if (!due) {
        return;
    }
    revealed.value = false;
    mimi.say(rating === 'again' ? 'forgot' : rating);
    try {
        await srs.rate(due.card.id, due.card.deckId, rating);
        completedCount.value += 1;
        counts[rating] += 1;
        if (srs.dueCount === 0) {
            active.value = false;
            finished.value = true;
            mimi.say('done');
        }
    } catch (e) {
        const err = e as { message?: string };
        toast.error(err?.message ?? t('review.errors.rate_failed'));
    }
};

const formatNext = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    const hours = Math.round(diff / (60 * 60 * 1000));
    return hours < 24
        ? t('review.inHours').replace('{h}', String(hours))
        : t('review.inDays').replace('{d}', String(Math.round(hours / 24)));
};

const onKey = (e: KeyboardEvent) => {
    if (!active.value) {
        return;
    }
    if (e.key === ' ') {
        e.preventDefault();
        revealed.value = !revealed.value;
        return;
    }
    if (revealed.value) {
        const map: Record<string, SrsRating> = {
            '1': 'again',
            '2': 'hard',
            '3': 'good',
            '4': 'easy',
        };
        const rating = map[e.key];
        if (rating) {
            e.preventDefault();
            onRate(rating);
        }
    }
};

onMounted(async () => {
    await srs.fetchAll();
    window.addEventListener('keydown', onKey);
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey);
});
</script>
