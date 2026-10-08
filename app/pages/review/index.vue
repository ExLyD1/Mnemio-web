<template>
    <div class="mx-auto max-w-6xl p-6 lg:p-8">
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
        <template v-else>
            <div class="flex flex-col gap-6 pb-24">
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
                        <UiButton v-else variant="ghost" class="!text-small" @click="cancelSelect">
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
                    class="fixed inset-x-0 bottom-0 z-20 flex items-center justify-center gap-4 border-t border-line bg-bg-surface p-4 shadow-soft-elevation md:left-[76px]"
                >
                    <p class="text-small text-brand-muted">
                        {{
                            pickedIds.size > 0
                                ? t('review.deckDueCount').replace('{n}', String(selectedDueCount))
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
    </div>
</template>

<script setup lang="ts">
import { CheckCheck } from 'lucide-vue-next';
import { useSrsStore, useDecks, useT } from '#imports';
import { useAnalytics } from '@/composables/useAnalytics';
import { deckToCardVm } from '@/utils/deckVm';

// A normal content page in the "default" app shell (AppRail + AppTopbar),
// same chrome as /dashboard and /decks. The active session lives on its own
// route (session.vue) under the full-bleed "study" layout — same split as
// /study/:id (picker, default) vs /study/:id/:mode (session, study). Keeping
// them as separate pages, rather than one page that calls `setPageLayout`,
// avoids a real Nuxt pitfall: `<NuxtLayout>` keys its subtree on the layout
// name, so switching layout on ONE page remounts it and wipes its state.
definePageMeta({ layout: 'default' });

const route = useRoute();
const srs = useSrsStore();
const { store, fetchList } = useDecks();
const { t } = useT();
const analytics = useAnalytics();

useSeo({ title: t('seo.reviewTitle'), description: t('seo.appDesc'), noindex: true });

const selectMode = ref(false);
const pickedIds = ref<Set<string>>(new Set());

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

const startSession = (ids: string[] | null, mode: 'single' | 'multi' | 'all') => {
    srs.selectDecks(ids);
    analytics.track('practice_decks_selected', {
        selection_mode: mode,
        deck_count: ids === null ? deckCards.value.filter((d) => d.due > 0).length : ids.length,
        card_count: srs.activeDueCount,
    });
    navigateTo('/review/session');
};

const onPickDeck = (deckId: string) => {
    if (!selectMode.value) {
        startSession([deckId], 'single');
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
    startSession([...pickedIds.value], 'multi');
};

const onPracticeAll = () => {
    startSession(null, 'all');
};

const cancelSelect = () => {
    selectMode.value = false;
    pickedIds.value = new Set();
};

const formatNext = (iso: string) => {
    const diff = new Date(iso).getTime() - Date.now();
    const hours = Math.round(diff / (60 * 60 * 1000));
    return hours < 24
        ? t('review.inHours').replace('{h}', String(hours))
        : t('review.inDays').replace('{d}', String(Math.round(hours / 24)));
};

onMounted(async () => {
    await srs.fetchAll();
    await fetchList.execute({ cursor: null, append: false });

    // ?deck=<id> deep link: skip the picker and go straight into a single-deck
    // session, same as clicking that deck's card would.
    const deepLinkDeckId = typeof route.query.deck === 'string' ? route.query.deck : null;
    if (deepLinkDeckId && (srs.dueByDeck.get(deepLinkDeckId) ?? 0) > 0) {
        startSession([deepLinkDeckId], 'single');
    }
});
</script>

<style scoped>
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
