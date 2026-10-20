<template>
    <section class="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <SharedPageLoader v-if="!ready" />
        <template v-else>
            <NuxtLink v-if="deckId" :to="`/decks/${deckId}`" class="text-small text-cream">
                ← {{ t('study.backToDeck') }}
            </NuxtLink>
            <h1 class="font-display text-display-sm text-cream">
                {{ deck?.title || t('seo.reviewTitle') }}
            </h1>
            <p class="text-body text-cream">{{ t('practice.chooseMode') }}</p>
            <UiEmptyState v-if="error" :title="t('study.couldNotStartTitle')" :message="error">
                <template #action
                    ><UiButton @click="initialize">{{ t('practice.retry') }}</UiButton></template
                >
            </UiEmptyState>
            <UiEmptyState
                v-else-if="deckId && deck && deck.cards.length === 0"
                :title="t('study.emptyDeckTitle')"
                :message="t('study.emptyDeckMessage')"
            >
                <template #action>
                    <UiButton variant="primary" @click="navigateTo(`/decks/${deckId}`)">
                        {{ t('card.add') }}
                    </UiButton>
                </template>
            </UiEmptyState>
            <template v-else>
                <div
                    class="grid gap-4 sm:grid-cols-2"
                    :class="busy ? 'pointer-events-none opacity-50' : ''"
                    :aria-busy="busy"
                >
                    <StudyModeCard
                        :icon="CalendarClock"
                        :title="t('practice.srs')"
                        :description="t('practice.srsDescription')"
                        :meta="srsMeta"
                        @select="choose('srs')"
                    />
                    <StudyModeCard
                        :icon="Layers"
                        :title="t('practice.know')"
                        :description="t('practice.knowDescription')"
                        :meta="knowMeta"
                        @select="choose('know')"
                    />
                </div>
                <div v-if="deckId" class="flex flex-wrap items-center gap-3">
                    <span class="text-small text-cream">{{ t('practice.format') }}</span>
                    <UiSegmentedControl v-model="format" :options="formats" />
                </div>
                <label class="flex items-center gap-2 text-small text-cream">
                    <input v-model="remember" type="checkbox" class="size-4 accent-brand" />
                    {{ t('practice.remember') }}
                </label>
                <p class="text-small text-cream">{{ t('practice.rememberHint') }}</p>
            </template>
        </template>
    </section>
</template>

<script setup lang="ts">
import { CalendarClock, Layers } from 'lucide-vue-next';
import { useSrsStore } from '@/stores/srs';
import { useAsync } from '@/composables/useAsync';
import { usePracticePreferences, readPracticeFormat } from '@/composables/usePracticePreferences';
import type { PracticeFormat } from '@/composables/usePracticePreferences';
import type { PracticeMode } from '@/types/srs';

const props = defineProps<{ deckId?: string }>();
const route = useRoute();
const { t } = useT();
const { apiErrorText } = useApiError();
const toast = useToast();
const prefs = usePracticePreferences();
const fetchQueue = useAsync(useSrsStore().fetchQueue);
const decks = useDecks();
const deck = computed(() => (decks.store.deck?.id === props.deckId ? decks.store.deck : null));
const ready = ref(false);
const busy = ref(false);
const error = ref('');
const remember = ref(false);
const format = ref<string>('flashcard');
const formats = computed(() => [
    { value: 'flashcard', label: t('practice.flashcards') },
    { value: 'multiple-choice', label: t('practice.quiz') },
]);
const srsMeta = computed(() => {
    const counts = fetchQueue.data.value?.counts;
    return t('practice.srsMeta')
        .replace('{due}', String((counts?.learning ?? 0) + (counts?.review ?? 0)))
        .replace('{new}', String(counts?.new ?? 0));
});
const knowMeta = computed(() => {
    const n = props.deckId
        ? (deck.value?.cards.length ?? 0)
        : (fetchQueue.data.value?.items.filter(
              (item) => !item.dueAt || Date.parse(item.dueAt) <= Date.now(),
          ).length ?? 0);
    return t('practice.knowMeta', n, { min: Math.max(1, Math.ceil(n / 6)) });
});

const go = (mode: PracticeMode, replace = false) =>
    navigateTo(
        props.deckId
            ? `/study/${props.deckId}/${format.value}?mode=${mode}`
            : `/review?mode=${mode}`,
        { replace },
    );
const choose = async (mode: PracticeMode) => {
    if (busy.value) return;
    busy.value = true;
    try {
        if (props.deckId) prefs.saveFormat(format.value as PracticeFormat);
        if (remember.value) {
            const saved = await prefs.update.execute({ defaultStudyMode: mode });
            if (!saved) {
                toast.error(apiErrorText(prefs.update.error.value));
                return;
            }
        }
        await go(mode);
    } finally {
        busy.value = false;
    }
};
const initialize = async () => {
    ready.value = false;
    error.value = '';
    format.value = readPracticeFormat();
    if (!prefs.store.loaded) {
        await prefs.hydrate.execute();
        if (prefs.hydrate.error.value) {
            error.value = apiErrorText(prefs.hydrate.error.value);
            ready.value = true;
            return;
        }
    }
    if (props.deckId) {
        await decks.fetchOne.execute(props.deckId);
        if (decks.fetchOne.error.value) {
            error.value = apiErrorText(decks.fetchOne.error.value);
            ready.value = true;
            return;
        }
    }
    // An empty deck has nothing to practice: show the "add cards" state instead
    // of jumping into an empty session.
    const empty = !!props.deckId && deck.value?.cards.length === 0;
    if (route.query.pick !== '1' && prefs.store.defaultStudyMode && !empty) {
        await go(prefs.store.defaultStudyMode, true);
        return;
    }
    if (!empty) {
        await fetchQueue.execute(props.deckId);
        if (fetchQueue.error.value) error.value = apiErrorText(fetchQueue.error.value);
    }
    ready.value = true;
};
watch(format, (value) => {
    if (import.meta.client && props.deckId) prefs.saveFormat(value as PracticeFormat);
});
onMounted(initialize);
</script>
