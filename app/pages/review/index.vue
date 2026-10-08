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
                <span class="text-small tabular-nums text-brand-muted">
                    {{ t('review.dueLeft').replace('{n}', String(srs.activeDueCount)) }}
                </span>
            </div>
            <div v-else class="flex-1" />
            <UiButton variant="ghost" class="!py-2 !text-small" @click="onHeaderBack">
                {{ active ? t('study.endSession') : t('common.back') }}
            </UiButton>
        </header>

        <main class="flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto p-6">
            <SharedPageLoader v-if="srs.loading && !srs.dueCards.length" />

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

            <!-- Deck picker: choose one deck, several, or everything. The SRS
                 algorithm still decides which cards appear and in what order
                 within the chosen scope — this only narrows the scope. -->
            <template v-else-if="phase === 'picker'">
                <div class="flex w-full max-w-5xl flex-col gap-6 pb-24">
                    <div class="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 class="font-display text-h2 text-cream">
                                {{ t('review.pickTitle') }}
                            </h1>
                            <p class="mt-1 text-body text-cream-dim">{{ t('review.pickHint') }}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <UiButton
                                v-if="!selectMode"
                                variant="ghost"
                                class="!text-small"
                                @click="selectMode = true"
                            >
                                {{ t('review.selectDecks') }}
                            </UiButton>
                            <UiButton
                                v-else
                                variant="ghost"
                                class="!text-small"
                                @click="cancelSelect"
                            >
                                {{ t('review.cancelSelect') }}
                            </UiButton>
                            <UiButton variant="primary" class="!text-small" @click="onPracticeAll">
                                {{ t('review.practiceAll') }}
                            </UiButton>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        <div v-for="deck in deckCards" :key="deck.id" class="relative">
                            <button
                                v-if="deck.due > 0"
                                type="button"
                                class="absolute inset-0 z-10 rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                                :aria-pressed="selectMode && pickedIds.has(deck.id)"
                                :aria-label="
                                    deck.title +
                                    ' · ' +
                                    t('review.deckDueCount').replace('{n}', String(deck.due))
                                "
                                @click="onPickDeck(deck.id)"
                            />
                            <SharedDeckCard
                                variant="library"
                                :deck="deck"
                                :class="[
                                    deck.due === 0 ? 'opacity-50' : '',
                                    pickedIds.has(deck.id) ? 'ring-2 ring-brand' : '',
                                ]"
                            />
                            <p
                                v-if="deck.due === 0"
                                class="mt-1 text-center text-[11px] text-brand-muted"
                            >
                                {{ t('review.studyFirstHint') }}
                            </p>
                        </div>
                    </div>

                    <div v-if="store.nextCursor" class="flex justify-center">
                        <UiButton
                            variant="ghost"
                            :disabled="store.loadingList"
                            @click="store.loadMore()"
                        >
                            {{ t('common.loadMore') }}
                        </UiButton>
                    </div>
                </div>

                <!-- Sticky multi-select action bar -->
                <Transition name="rate">
                    <div
                        v-if="selectMode"
                        class="fixed inset-x-0 bottom-0 z-20 flex items-center justify-center gap-4 border-t border-line bg-bg-surface p-4 shadow-soft-elevation"
                    >
                        <p class="text-small text-brand-muted">
                            {{
                                pickedIds.size > 0
                                    ? t('review.deckDueCount').replace(
                                          '{n}',
                                          String(selectedDueCount),
                                      )
                                    : t('review.selectionEmpty')
                            }}
                        </p>
                        <UiButton
                            variant="primary"
                            :disabled="pickedIds.size === 0"
                            @click="onPracticeSelected"
                        >
                            {{ t('review.practiceN').replace('{n}', String(pickedIds.size)) }}
                        </UiButton>
                    </div>
                </Transition>
            </template>

            <template v-else-if="phase === 'session' && active && studyCard">
                <div class="flex w-full items-center justify-center">
                    <div class="relative w-full max-w-3xl">
                        <Transition name="card" mode="out-in">
                            <StudyFlashCard
                                :key="studyCard.id"
                                :card="studyCard"
                                :revealed="revealed"
                                reserve-top-right
                                @flip="revealed = !revealed"
                            />
                        </Transition>
                        <!-- Tip button — visible only when revealed -->
                        <button
                            v-if="revealed"
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
                            v-if="revealed"
                            :previews="ratingPreviews"
                            @grade="onRate"
                        />
                        <p v-else class="hidden text-small text-brand-muted sm:block">
                            {{ t('study.revealHint') }}
                        </p>
                    </Transition>
                </div>
            </template>

            <template v-else-if="phase === 'results' || finished">
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
                    <UiButton variant="ghost" @click="backToPicker">
                        {{ t('review.pickTitle') }}
                    </UiButton>
                    <UiButton variant="primary" @click="navigateTo('/dashboard')">
                        {{ t('review.backToDashboard') }}
                    </UiButton>
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
import { useSrsStore, useDecks, useToast, useT, useApiError } from '#imports';
import { useAnalytics } from '@/composables/useAnalytics';
import { useRatingPreviews } from '@/composables/useRatingPreviews';
import { deckToCardVm } from '@/utils/deckVm';
import * as aiApi from '@/api/ai';
import type { ApiError } from '@/composables/useAsync';
import type { SrsRating } from '@/types/srs';
import type { StudyCard } from '@/utils/studyCard';

definePageMeta({ layout: 'study' });

const route = useRoute();
const srs = useSrsStore();
const { store, fetchList } = useDecks();
const toast = useToast();
const { t } = useT();
const { apiErrorText } = useApiError();
const analytics = useAnalytics();

useSeo({ title: t('seo.reviewTitle'), description: t('seo.appDesc'), noindex: true });

type Phase = 'picker' | 'session' | 'results';
const phase = ref<Phase>('picker');
const selectMode = ref(false);
const pickedIds = ref<Set<string>>(new Set());

const active = ref(false);
const revealed = ref(false);
const tipOpen = ref(false);
const tipLoading = ref(false);
const tipText = ref('');
const completedCount = ref(0);
const finished = ref(false);
const counts = reactive({ again: 0, hard: 0, good: 0, easy: 0 });

const currentDue = computed(() => srs.activeQueue[0] ?? null);

// useRatingPreviews must run at setup time (it calls useT/useI18n internally).
const currentProgress = computed(() => {
    const d = currentDue.value;
    return d ? srs.progress[d.card.id] : undefined;
});
const { previews: ratingPreviews } = useRatingPreviews(currentProgress);

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
        audioUrl: d.card.audioUrl ?? null,
    };
});

// Deck grid for the picker. `due` is overridden from the live SRS queue
// (srs.dueByDeck), not DeckSummary.stats.due — the queue is the one source
// of truth for what a practice session will actually serve; stats.due can
// drift from it by up to the store's 30s freshness window.
const deckCards = computed(() =>
    store.summaries.map((d) => {
        const vm = deckToCardVm(d);
        return { ...vm, due: srs.dueByDeck.get(d.id) ?? 0 };
    }),
);

const selectedDueCount = computed(() =>
    [...pickedIds.value].reduce((sum, id) => sum + (srs.dueByDeck.get(id) ?? 0), 0),
);

const beginSession = (ids: string[] | null, mode: 'single' | 'multi' | 'all') => {
    srs.selectDecks(ids);
    analytics.track('practice_decks_selected', {
        selection_mode: mode,
        deck_count: ids === null ? deckCards.value.filter((d) => d.due > 0).length : ids.length,
        card_count: srs.activeDueCount,
    });
    completedCount.value = 0;
    revealed.value = false;
    active.value = true;
    finished.value = false;
    counts.again = 0;
    counts.hard = 0;
    counts.good = 0;
    counts.easy = 0;
    phase.value = 'session';
};

const onPickDeck = (deckId: string) => {
    if (!selectMode.value) {
        beginSession([deckId], 'single');
        return;
    }
    const next = new Set(pickedIds.value);
    if (next.has(deckId)) {
        next.delete(deckId);
    } else {
        next.add(deckId);
    }
    pickedIds.value = next;
};

const onPracticeSelected = () => {
    if (pickedIds.value.size === 0) {
        return;
    }
    beginSession([...pickedIds.value], 'multi');
    selectMode.value = false;
    pickedIds.value = new Set();
};

const onPracticeAll = () => {
    beginSession(null, 'all');
};

const cancelSelect = () => {
    selectMode.value = false;
    pickedIds.value = new Set();
};

const backToPicker = () => {
    srs.selectDecks(null);
    phase.value = 'picker';
    finished.value = false;
};

const onHeaderBack = () => {
    if (active.value) {
        active.value = false;
        backToPicker();
        return;
    }
    navigateTo('/dashboard');
};

const onRate = async (rating: SrsRating) => {
    const due = currentDue.value;
    if (!due) {
        return;
    }
    revealed.value = false;
    try {
        await srs.rate(due.card.id, due.card.deckId, rating);
        completedCount.value += 1;
        counts[rating] += 1;
        if (srs.activeDueCount === 0) {
            active.value = false;
            finished.value = true;
            phase.value = 'results';
            analytics.track('review_due_cleared', { cards_reviewed: completedCount.value });
        }
    } catch (e) {
        toast.error(apiErrorText(e as ApiError, 'review.errors.rate_failed'));
    }
};

const formatNext = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    const hours = Math.round(diff / (60 * 60 * 1000));
    return hours < 24
        ? t('review.inHours').replace('{h}', String(hours))
        : t('review.inDays').replace('{d}', String(Math.round(hours / 24)));
};

watch(tipOpen, async (open) => {
    if (!open) return;
    if (tipText.value) return;
    tipLoading.value = true;
    tipText.value = '';
    try {
        const s = await aiApi.suggest('review', studyCard.value?.deckId);
        tipText.value = s.suggestion;
    } catch {
        tipText.value = '';
    } finally {
        tipLoading.value = false;
    }
});

watch(studyCard, () => {
    tipOpen.value = false;
    tipText.value = '';
});

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
    await fetchList.execute({ cursor: null, append: false });
    window.addEventListener('keydown', onKey);

    // ?deck=<id> deep link: skip the picker and go straight into a single-deck
    // session, same as clicking that deck's card would.
    const deepLinkDeckId = typeof route.query.deck === 'string' ? route.query.deck : null;
    if (deepLinkDeckId && (srs.dueByDeck.get(deepLinkDeckId) ?? 0) > 0) {
        beginSession([deepLinkDeckId], 'single');
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey);
});
</script>

<style scoped>
/* Card X-axis transition (matches study page) */
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

/* Rating row fade transition (matches study page) */
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
