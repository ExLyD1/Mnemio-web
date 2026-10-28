<template>
    <section class="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 pb-28 sm:p-6 md:pb-6">
        <header class="flex flex-wrap items-end justify-between gap-4">
            <div class="flex min-w-0 flex-col gap-1">
                <h1 class="font-display text-display-sm text-cream">{{ t('review.title') }}</h1>
                <p class="text-body text-brand-muted">{{ t('review.subtitle') }}</p>
            </div>
            <div role="group" :aria-label="t('review.modeLabel')">
                <UiSegmentedControl v-model="mode" :options="modes" />
            </div>
        </header>

        <div
            v-if="loading"
            class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            aria-busy="true"
        >
            <div class="col-span-full h-12 animate-pulse rounded-full bg-bg-surface sm:w-64" />
            <div v-for="i in 8" :key="i" class="h-36 animate-pulse rounded-2xl bg-bg-surface" />
        </div>

        <UiEmptyState v-else-if="error" :title="t('review.loadFailed')" :message="error">
            <template #action>
                <UiButton @click="load">{{ t('practice.retry') }}</UiButton>
            </template>
        </UiEmptyState>

        <UiEmptyState
            v-else-if="!decks.length"
            :icon="CheckCheck"
            :title="t('review.allCaughtUpTitle')"
            :message="caughtUpMessage"
        >
            <template #action>
                <UiButton variant="primary" @click="navigateTo('/decks')">
                    {{ t('review.browseDecks') }}
                </UiButton>
            </template>
        </UiEmptyState>

        <template v-else>
            <!-- Start bar: inline on desktop, a sticky bottom bar on mobile while selecting. -->
            <div
                :class="[
                    'flex flex-wrap items-center gap-3',
                    selecting
                        ? 'fixed inset-x-0 bottom-16 z-30 border-t border-line bg-bg-surface/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none'
                        : '',
                ]"
            >
                <UiButton variant="primary" class="min-w-0 flex-1 md:flex-none" @click="start">
                    {{
                        selecting
                            ? t('review.reviewDecks', selected.size)
                            : t('review.reviewAll', totalDue)
                    }}
                </UiButton>
                <div
                    v-if="selected.size > 1"
                    role="group"
                    :aria-label="t('review.orderLabel')"
                    class="order-first w-full md:order-none md:w-auto"
                >
                    <UiSegmentedControl v-model="order" :options="orders" :fluid="true" />
                </div>
                <UiButton v-if="selecting" variant="ghost" @click="clearSelection">
                    {{ t('review.clearSelection') }}
                </UiButton>
            </div>
            <p v-if="!selecting" class="-mt-3 text-small text-brand-muted">
                {{ t('review.hubHint') }}
            </p>

            <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <li v-for="deck in decks" :key="deck.deckId">
                    <ReviewDeckTile
                        :deck="deck"
                        :selecting="selecting"
                        :selected="selected.has(deck.deckId)"
                        @open="startDeck(deck.deckId)"
                        @toggle="toggle(deck.deckId)"
                    />
                </li>
            </ul>
        </template>
    </section>
</template>

<script setup lang="ts">
import { CheckCheck } from 'lucide-vue-next';
import { useSrsStore } from '@/stores/srs';
import { useAsync } from '@/composables/useAsync';
import { usePracticePreferences } from '@/composables/usePracticePreferences';
import {
    MAX_REVIEW_DECKS,
    reviewScopeQuery,
    type ReviewOrder,
    type ReviewScope,
} from '@/utils/reviewScope';
import type { PracticeMode } from '@/types/srs';

const { t } = useT();
const { current: locale } = useAppLocale();
const { apiErrorText } = useApiError();
const toast = useToast();
const srs = useSrsStore();
const prefs = usePracticePreferences();
const fetchAll = useAsync(srs.fetchAll);

const ready = ref(false);
const loading = computed(() => !ready.value || fetchAll.loading.value);
const error = computed(() => (fetchAll.error.value ? apiErrorText(fetchAll.error.value) : ''));
const decks = computed(() => srs.byDeck);
const totalDue = computed(() => decks.value.reduce((sum, deck) => sum + deck.due, 0));

// Preset from the saved default; changing it here doesn't save a preference.
const mode = ref<PracticeMode>('srs');
const modes = computed(() => [
    { value: 'srs', label: t('review.modeSrs') },
    { value: 'know', label: t('review.modeKnow') },
]);
const order = ref<ReviewOrder>('mixed');
const orders = computed(() => [
    { value: 'mixed', label: t('review.orderMixed') },
    { value: 'by_deck', label: t('review.orderByDeck') },
]);

const selected = ref(new Set<string>());
const selecting = computed(() => selected.value.size > 0);
const toggle = (deckId: string) => {
    const next = new Set(selected.value);
    if (next.has(deckId)) {
        next.delete(deckId);
    } else if (next.size >= MAX_REVIEW_DECKS) {
        toast.info(t('review.selectionCap').replace('{n}', String(MAX_REVIEW_DECKS)));
        return;
    } else {
        next.add(deckId);
    }
    selected.value = next;
};
const clearSelection = () => {
    selected.value = new Set();
    order.value = 'mixed';
};

const go = (scope: Omit<ReviewScope, 'mode'>) =>
    navigateTo({ path: '/review', query: reviewScopeQuery({ ...scope, mode: mode.value }) });
const startDeck = (deckId: string) => go({ deckIds: [deckId], order: 'mixed' });
const start = () => {
    if (!selecting.value) {
        return go({ deckIds: null, order: 'mixed' });
    }
    // Hub order (most due first), not tick order, so deck-by-deck is predictable.
    const ids = decks.value.map((d) => d.deckId).filter((id) => selected.value.has(id));
    return go({ deckIds: ids, order: ids.length > 1 ? order.value : 'mixed' });
};

const caughtUpMessage = computed(() => {
    if (!Object.keys(srs.progress).length) {
        return t('review.noProgressYet');
    }
    const next = srs.nextReviewAt;
    if (!next) {
        return '';
    }
    const minutes = Math.max(1, Math.ceil((Date.parse(next) - Date.now()) / 60000));
    const unit = minutes < 60 ? 'minute' : minutes < 1440 ? 'hour' : 'day';
    const amount =
        unit === 'minute'
            ? minutes
            : unit === 'hour'
              ? Math.ceil(minutes / 60)
              : Math.ceil(minutes / 1440);
    const when = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }).format(
        amount,
        unit,
    );
    return t('review.nextReviewAt').replace('{when}', when);
});

const load = async () => {
    await fetchAll.execute({ force: true });
    ready.value = true;
};
const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && selecting.value) {
        clearSelection();
    }
};
onMounted(async () => {
    window.addEventListener('keydown', onKey);
    if (!prefs.store.loaded) {
        await prefs.hydrate.execute();
    }
    mode.value = prefs.store.defaultStudyMode ?? 'srs';
    await load();
});
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>
