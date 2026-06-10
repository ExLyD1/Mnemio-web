<template>
    <section
        class="mx-auto flex min-h-screen max-w-2xl flex-col items-center gap-8 p-8 text-center"
    >
        <UiEmptyState
            v-if="!result"
            :title="t('study.noResultsTitle')"
            :message="t('study.noResultsMessage')"
        >
            <template #action>
                <UiButton variant="primary" @click="navigateTo(`/decks/${deckId}`)">
                    {{ t('study.backToDeck') }}
                </UiButton>
            </template>
        </UiEmptyState>

        <template v-else>
            <SharedMimi mood="done" :size="140" />

            <div>
                <p class="text-eyebrow uppercase text-brand-muted">
                    {{ result.deckTitle }} · {{ t('study.sessionComplete') }}
                </p>
                <h1 class="mt-2 font-display text-display-sm text-cream">
                    {{ t('study.niceWork') }}<span v-if="name">, {{ name }}</span
                    >.
                </h1>
                <p class="mt-2 text-body text-cream-dim">{{ summaryLine }}</p>
            </div>

            <div class="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                <SharedStatTile :label="t('study.reviewed')" :value="result.reviewed" />
                <SharedStatTile
                    :label="t('study.recalled')"
                    :value="`${accuracy}%`"
                    tone="accent"
                />
                <SharedStatTile :label="t('study.streak')" :value="`${result.streak}d`" />
                <SharedStatTile :label="t('study.time')" :value="timeLabel" />
            </div>

            <div class="w-full rounded-[20px] border border-line bg-bg-surface p-5 text-left">
                <p class="text-eyebrow uppercase text-brand-muted">{{ t('study.howItWent') }}</p>
                <div class="mt-3">
                    <SharedBreakdownBar :segments="segments" />
                </div>
            </div>

            <div v-if="result.revisit.length" class="w-full text-left">
                <p class="text-eyebrow uppercase text-brand-muted">
                    {{ t('study.wordsToRevisit') }}
                </p>
                <div class="mt-3 flex flex-col gap-2">
                    <div
                        v-for="(word, i) in result.revisit"
                        :key="i"
                        class="flex items-center justify-between gap-4 rounded-xl border border-line bg-bg-surface px-4 py-3"
                    >
                        <div>
                            <p class="font-display text-base text-cream">{{ word.word }}</p>
                            <p v-if="word.reading" class="text-small text-brand-muted">
                                {{ word.reading }}
                            </p>
                        </div>
                        <p class="text-small text-brand-muted">{{ word.meaning }}</p>
                    </div>
                </div>
            </div>

            <div class="flex w-full flex-wrap items-center justify-center gap-3">
                <UiButton variant="ghost" @click="navigateTo(`/study/${deckId}`)">
                    <RotateCcw class="size-4" /> {{ t('study.studyAgain') }}
                </UiButton>
                <UiButton variant="primary" @click="navigateTo(`/decks/${deckId}`)">
                    {{ t('study.backToDeck') }}
                </UiButton>
            </div>
        </template>
    </section>
</template>

<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next';
import { useAuthStore, useT } from '#imports';
import { usePracticeStore } from '@/stores/practice';

definePageMeta({ layout: 'study' });

const route = useRoute();
const deckId = computed(() => String(route.params.deckId));

const practiceStore = usePracticeStore();
const auth = useAuthStore();
const { t } = useT();

useSeo({ title: t('seo.studyTitle'), description: t('seo.appDesc'), noindex: true });

const result = computed(() => practiceStore.lastResult);
const name = computed(() => auth.currentUser?.displayName ?? auth.currentUser?.username ?? '');

const accuracy = computed(() =>
    result.value && result.value.reviewed > 0
        ? Math.round((result.value.correct / result.value.reviewed) * 100)
        : 0,
);

const timeLabel = computed(() => {
    const totalSeconds = Math.round((result.value?.timeMs ?? 0) / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
});

const summaryLine = computed(() => {
    if (!result.value) {
        return '';
    }
    const slipped = result.value.revisit.length;
    const base = t('study.summaryRecalled')
        .replace('{pct}', String(accuracy.value))
        .replace('{total}', String(result.value.reviewed));
    return slipped > 0
        ? base + t('study.summaryRevisit').replace('{n}', String(slipped))
        : base + t('study.summaryPerfect');
});

const segments = computed(() => {
    const counts = result.value?.counts ?? { again: 0, hard: 0, good: 0, easy: 0 };
    return [
        { label: t('study.unknown'), count: counts.again, color: 'bg-error-soft' },
        { label: t('review.hard'), count: counts.hard, color: 'bg-brand-bright' },
        { label: t('review.good'), count: counts.good, color: 'bg-brand' },
        { label: t('review.easy'), count: counts.easy, color: 'bg-success-bright' },
    ];
});
</script>
