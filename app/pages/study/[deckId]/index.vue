<template>
    <section class="mx-auto flex max-w-3xl flex-col gap-8 p-6">
        <header>
            <button
                type="button"
                class="flex items-center gap-1.5 text-small text-cream-dim transition-colors hover:text-cream"
                @click="navigateTo(`/decks/${deckId}`)"
            >
                <ArrowLeft class="size-4" />
                {{ t('study.backToDeck') }}
            </button>
            <h1 v-if="store.deck" class="mt-3 break-words font-display text-display-sm text-cream">
                {{ store.deck.title }}
            </h1>
            <p class="mt-2 text-body text-cream-dim">{{ t('study.modePickerHint') }}</p>
            <p v-if="cardCount" class="mt-1 text-small text-brand-muted">
                {{ t('study.deckCardCount').replace('{n}', String(cardCount)) }}
                · {{ t('study.practiceSrsNote') }}
            </p>
        </header>

        <SharedPageLoader v-if="store.loadingDeck && !store.deck" />

        <UiEmptyState
            v-else-if="!store.deck"
            :title="t('deck.notFoundTitle')"
            :message="t('deck.notFoundMessage')"
        >
            <template #action>
                <UiButton variant="primary" @click="navigateTo('/decks')">
                    {{ t('deck.backToDecks') }}
                </UiButton>
            </template>
        </UiEmptyState>

        <UiEmptyState
            v-else-if="store.deck.cards.length === 0"
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
            <!-- Mode cards -->
            <div class="grid gap-4 sm:grid-cols-2">
                <StudyModeCard
                    :icon="Layers"
                    :title="t('study.flashcardTitle')"
                    :description="t('study.flashcardDescription')"
                    :meta="flashcardMeta"
                    @select="goStudy('flashcard')"
                />
                <StudyModeCard
                    :icon="ListChecks"
                    :title="t('study.multipleChoiceTitle')"
                    :description="t('study.multipleChoiceDescription')"
                    :meta="multipleChoiceMeta"
                    @select="goStudy('multiple-choice')"
                />
            </div>

            <!-- SRS / browse toggle -->
            <div
                class="flex items-center justify-between gap-4 rounded-2xl border border-line bg-bg-surface px-4 py-3"
            >
                <div>
                    <p class="text-small font-medium text-cream">{{ t('study.srsLabel') }}</p>
                    <p class="mt-0.5 text-small text-brand-muted">
                        {{ srsEnabled ? t('study.srsOnHint') : t('study.srsOffHint') }}
                    </p>
                </div>
                <button
                    type="button"
                    role="switch"
                    :aria-checked="srsEnabled"
                    :aria-label="t('study.srsLabel')"
                    class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    :class="srsEnabled ? 'border-brand bg-brand' : 'border-line bg-bg-surface-2'"
                    @click="srsEnabled = !srsEnabled"
                >
                    <span
                        class="pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full transition-transform"
                        :class="
                            srsEnabled
                                ? 'translate-x-[22px] bg-white'
                                : 'translate-x-0.5 bg-brand-muted'
                        "
                    />
                </button>
            </div>
        </template>
    </section>
</template>

<script setup lang="ts">
import { ArrowLeft, Layers, ListChecks } from 'lucide-vue-next';
import { useDecks, useT } from '#imports';

definePageMeta({ layout: 'default' });

const route = useRoute();
const deckId = computed(() => String(route.params.deckId));

const { store, fetchOne } = useDecks();
const { t } = useT();

useSeo({ title: t('seo.studyTitle'), description: t('seo.appDesc'), noindex: true });

const cardCount = computed(() => store.deck?.cards.length ?? 0);
const flashcardMeta = computed(() => {
    if (!cardCount.value) return undefined;
    const mins = Math.max(1, Math.ceil((cardCount.value * 10) / 60));
    return `${cardCount.value} ${t('study.cards')} · ~${mins} ${t('study.min')}`;
});
const multipleChoiceMeta = computed(() => {
    if (!cardCount.value) return undefined;
    const mins = Math.max(1, Math.ceil((cardCount.value * 15) / 60));
    return `${cardCount.value} ${t('study.cards')} · ~${mins} ${t('study.min')}`;
});

// SRS toggle — persisted in localStorage so the choice survives page refreshes.
const SRS_KEY = 'mnemio_srs_enabled';
const srsEnabled = ref(true);

onMounted(() => {
    const saved = localStorage.getItem(SRS_KEY);
    if (saved !== null) srsEnabled.value = saved !== 'false';
    if (!store.deck || store.deck.id !== deckId.value) {
        fetchOne.execute(deckId.value);
    }
});

watch(srsEnabled, (val) => {
    localStorage.setItem(SRS_KEY, String(val));
});

const goStudy = (mode: 'flashcard' | 'multiple-choice') => {
    const query = srsEnabled.value ? '' : '?srs=0';
    navigateTo(`/study/${deckId.value}/${mode}${query}`);
};
</script>
