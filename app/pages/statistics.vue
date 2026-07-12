<template>
    <section class="mx-auto flex max-w-6xl flex-col gap-6 p-8">
        <header class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 class="font-display text-display-sm text-cream">{{ t('statistics.title') }}</h1>
                <p class="mt-1 text-body text-cream-dim">{{ t('statistics.subtitle') }}</p>
            </div>
            <UiSegmentedControl v-model="range" :options="rangeOptions" />
        </header>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SharedStatTile
                :label="t('statistics.due')"
                :value="dueTotal"
                :sub="t('statistics.dueSub')"
                tone="plum"
            />
            <SharedStatTile
                :label="t('statistics.reviewed')"
                :value="stats.reviewed.value"
                :sub="t('statistics.reviewedSub')"
                :trend="reviewedTrend"
                tone="blue"
            />
            <SharedStatTile
                :label="t('statistics.retention')"
                :value="`${stats.retention.value}%`"
                :trend="retentionTrend"
                tone="green"
            />
            <SharedStatTile
                :label="t('statistics.daysPracticed')"
                :value="daysPracticed"
                :sub="t('statistics.daysPracticedSub')"
                tone="pink"
            />
        </div>

        <!-- Weakest decks -->
        <div v-if="weakestDecks.length" class="rounded-[20px] border border-line bg-bg-surface p-5">
            <p class="mb-4 text-eyebrow uppercase text-brand-muted">
                {{ t('statistics.weakestDecks') }}
            </p>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div
                    v-for="d in weakestDecks"
                    :key="d.id"
                    class="flex flex-col gap-3 rounded-2xl border border-line bg-bg-surface-2 p-4"
                >
                    <div class="flex items-start justify-between gap-2">
                        <p class="line-clamp-2 font-display text-base text-cream">{{ d.title }}</p>
                        <SharedPill v-if="d.due > 0" tone="due" class="shrink-0">{{
                            t('dashboard.dueCount').replace('{n}', String(d.due))
                        }}</SharedPill>
                    </div>
                    <SharedProgressBar
                        :value="d.masteredPct"
                        :class="
                            d.masteredPct < 40
                                ? '[&_[data-fill]]:bg-error-soft'
                                : d.masteredPct < 65
                                  ? '[&_[data-fill]]:bg-vib-amber'
                                  : '[&_[data-fill]]:bg-success'
                        "
                    />
                    <div class="flex items-center justify-between">
                        <span class="text-small text-brand-muted">{{ d.masteredPct }}%</span>
                        <UiButton
                            variant="ghost"
                            class="!py-1 !text-small"
                            @click="navigateTo(`/study/${d.id}`)"
                        >
                            {{ t('statistics.review') }}
                        </UiButton>
                    </div>
                </div>
            </div>
        </div>

        <!-- Decks studied (Item 4) -->
        <div
            v-if="stats.decksStudied.value.length"
            class="rounded-[20px] border border-line bg-bg-surface p-5"
        >
            <p class="mb-4 text-eyebrow uppercase text-brand-muted">
                {{ t('statistics.decksStudied') }}
            </p>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div
                    v-for="d in stats.decksStudied.value"
                    :key="d.deckId"
                    class="flex flex-col gap-3 rounded-2xl border border-line bg-bg-surface-2 p-4"
                >
                    <p class="line-clamp-2 font-display text-base text-cream">{{ d.title }}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-small text-brand-muted">
                            {{
                                t('statistics.dsSessionCount').replace(
                                    '{n}',
                                    String(d.sessionCount),
                                )
                            }}
                        </span>
                        <span class="text-small text-brand-muted">
                            {{
                                t('statistics.dsCardsReviewed').replace(
                                    '{n}',
                                    String(d.cardsReviewed),
                                )
                            }}
                        </span>
                    </div>
                    <p class="text-small text-brand-muted">
                        {{ t('statistics.dsLastStudied') }}:
                        {{ formatLastStudied(d.lastStudiedAt) }}
                    </p>
                    <UiButton
                        variant="ghost"
                        class="!py-1 !text-small"
                        @click="navigateTo(`/study/${d.deckId}`)"
                    >
                        {{ t('statistics.review') }}
                    </UiButton>
                </div>
            </div>
        </div>

        <div class="rounded-[20px] border border-line bg-bg-surface p-5">
            <p class="mb-3 text-eyebrow uppercase text-brand-muted">
                {{ t('statistics.activity') }}
            </p>
            <SharedActivityHeatmap :weeks="heat" />
        </div>

        <!-- Cards reviewed chart -->
        <div class="rounded-[20px] border border-line bg-bg-surface p-5">
            <p class="mb-4 text-eyebrow uppercase text-brand-muted">
                {{ t('statistics.cardsReviewed') }}
            </p>
            <div class="flex h-40 items-end gap-1">
                <div
                    v-for="(d, i) in series"
                    :key="i"
                    class="flex-1 rounded-t bg-brand transition-all hover:bg-brand-bright"
                    :style="{ height: `${(d.value / maxReviewed) * 100}%` }"
                    :title="`${d.label}: ${d.value}`"
                />
            </div>
            <div class="relative mt-1 flex gap-1">
                <div v-for="(d, i) in series" :key="i" class="flex-1">
                    <template v-if="showBarLabel(i, series.length)">
                        <div class="mx-auto h-1.5 w-px bg-line" />
                        <div class="text-center text-[10px] leading-tight text-brand-muted">
                            {{ formatBarLabel(d.label, series.length) }}
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <!-- Study time chart (Item 2) -->
        <div class="rounded-[20px] border border-line bg-bg-surface p-5">
            <p class="mb-4 text-eyebrow uppercase text-brand-muted">
                {{ t('statistics.studyTime') }}
            </p>
            <div class="flex h-40 items-end gap-1">
                <div
                    v-for="(d, i) in stats.studyTime.value"
                    :key="i"
                    class="flex-1 rounded-t bg-lavender transition-all hover:bg-lavender/80"
                    :style="{ height: `${(d.value / maxStudyTime) * 100}%` }"
                    :title="`${d.label}: ${msToMin(d.value)} ${t('statistics.studyTimeUnit')}`"
                />
            </div>
            <div class="relative mt-1 flex gap-1">
                <div v-for="(d, i) in stats.studyTime.value" :key="i" class="flex-1">
                    <template v-if="showBarLabel(i, stats.studyTime.value.length)">
                        <div class="mx-auto h-1.5 w-px bg-line" />
                        <div class="text-center text-[10px] leading-tight text-brand-muted">
                            {{ formatBarLabel(d.label, stats.studyTime.value.length) }}
                        </div>
                    </template>
                </div>
            </div>
        </div>

        <!-- Mastery curve — coming soon (Item 3) -->
        <div class="rounded-[20px] border border-line bg-bg-surface p-5">
            <p class="mb-4 text-eyebrow uppercase text-brand-muted">
                {{ t('statistics.cardSeries') }}
            </p>
            <div
                v-if="stats.cardSeriesPending.value"
                class="flex flex-col items-center gap-3 py-8 text-center"
            >
                <Clock class="size-6 text-brand-muted opacity-50" />
                <p class="max-w-sm text-body text-brand-muted">
                    {{ t('statistics.cardSeriesComingSoon') }}
                </p>
            </div>
        </div>

        <div class="rounded-[20px] border border-line bg-bg-surface p-5">
            <p class="mb-4 text-eyebrow uppercase text-brand-muted">
                {{ t('statistics.deckPerformance') }}
            </p>
            <div v-if="store.summaries.length" class="flex flex-col gap-1">
                <div
                    v-for="d in store.summaries"
                    :key="d.id"
                    class="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-brand/10"
                >
                    <NuxtLink
                        :to="`/decks/${d.id}`"
                        class="truncate font-display text-base text-cream hover:underline"
                    >
                        {{ d.title }}
                    </NuxtLink>
                    <span class="text-small text-brand-muted">{{
                        t('statistics.cardsCount').replace('{n}', String(d.cardCount))
                    }}</span>
                    <span class="w-28">
                        <SharedProgressBar :value="d.stats.masteredPct" />
                    </span>
                </div>
            </div>
            <p v-else class="text-body text-brand-muted">{{ t('statistics.noDecks') }}</p>
        </div>

        <div class="rounded-[20px] border border-line bg-bg-surface p-5">
            <p class="mb-4 text-eyebrow uppercase text-brand-muted">
                {{ t('statistics.achievements') }}
            </p>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div
                    v-for="a in achievements.items.value"
                    :key="a.id"
                    :class="[
                        'flex flex-col items-center gap-2 rounded-2xl border p-4 text-center',
                        a.earned
                            ? 'border-brand-bright bg-brand/20'
                            : 'border-line bg-bg-surface-2 opacity-60',
                    ]"
                >
                    <component
                        :is="a.earned ? Trophy : Lock"
                        class="size-6"
                        :class="a.earned ? 'text-vib-amber' : 'text-brand-muted'"
                    />
                    <span class="text-small font-semibold text-cream">{{ a.name }}</span>
                    <span class="text-small text-brand-muted">{{ a.description }}</span>
                </div>
            </div>
        </div>

        <div
            class="flex flex-col items-center gap-5 rounded-[20px] border border-line bg-mimi-ambient p-6 text-center sm:flex-row sm:text-left"
        >
            <SharedMimi :size="96" placement="left" />
            <div class="flex-1">
                <p class="text-eyebrow uppercase text-brand-pale">
                    {{ t('statistics.insightEyebrow') }}
                </p>
                <p class="mt-1 text-body text-cream">{{ insight }}</p>
            </div>
            <UiButton variant="primary" @click="navigateTo('/review')">{{
                t('statistics.startHint')
            }}</UiButton>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Trophy, Lock, Clock } from 'lucide-vue-next';
import { useDecks, useT } from '#imports';
import { useStats } from '@/composables/useStats';
import { useAchievements } from '@/composables/useAchievements';
import { useAppLocale } from '@/composables/useAppLocale';
import type { StatsRange, StatsTrend } from '@/types/stats';

definePageMeta({ layout: 'default' });

const { store, fetchList } = useDecks();
const { t } = useT();
const stats = useStats();
const { current: locale } = useAppLocale();

useSeo({ title: t('seo.statisticsTitle'), description: t('seo.appDesc'), noindex: true });
const achievements = useAchievements();
const dueTotal = computed(() => store.summaries.reduce((sum, d) => sum + d.stats.due, 0));

const weakestDecks = computed(() =>
    [...store.summaries]
        .sort((a, b) => a.stats.masteredPct - b.stats.masteredPct)
        .slice(0, 4)
        .map((d) => ({
            id: d.id,
            title: d.title,
            masteredPct: d.stats.masteredPct,
            due: d.stats.due,
        })),
);

const daysPracticed = computed(() => {
    const pts = stats.series.value;
    return pts.filter((p) => p.value > 0).length;
});

const range = ref<StatsRange>('30');
const rangeOptions = computed(() => [
    { value: '7', label: t('statistics.range7') },
    { value: '30', label: t('statistics.range30') },
    { value: '90', label: t('statistics.range90') },
    { value: 'all', label: t('statistics.rangeAll') },
]);

const series = computed(() => stats.series.value);
const maxReviewed = computed(() => Math.max(1, ...series.value.map((d) => d.value)));
const maxStudyTime = computed(() => Math.max(1, ...stats.studyTime.value.map((d) => d.value)));
const heat = computed(() => stats.yearHeat.value);

const msToMin = (ms: number): number => Math.round(ms / 60000);

const formatLastStudied = (iso: string): string =>
    new Date(iso).toLocaleDateString(locale.value === 'uk' ? 'uk-UA' : 'en-US', {
        month: 'short',
        day: 'numeric',
    });

// Shared bar-label helpers used by all bar charts.
const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const showBarLabel = (i: number, total: number): boolean => {
    if (total <= 14) return true;
    const step = total <= 31 ? 7 : 14;
    if (i % step === 0 || i === 0) return true;
    if (i === total - 1) {
        const prevMark = Math.floor((total - 1) / step) * step;
        return i - prevMark >= 3;
    }
    return false;
};
const formatBarLabel = (label: string, total: number): string => {
    const d = new Date(label + 'T00:00:00Z');
    if (!isNaN(d.getTime())) {
        if (total <= 14) return DAY_ABBR[d.getUTCDay()] ?? label;
        return d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
    }
    return label;
};

const toTrend = (t: StatsTrend | undefined) => {
    const pct = t?.deltaPct ?? 0;
    return {
        dir: pct < 0 ? ('down' as const) : ('up' as const),
        label: `${pct >= 0 ? '+' : ''}${pct}%`,
    };
};
const reviewedTrend = computed(() => toTrend(stats.overview.value?.trends.reviewed));
const retentionTrend = computed(() => toTrend(stats.overview.value?.trends.retention));

const insight = computed(() => {
    const weakest = store.summaries
        .map((d) => ({ title: d.title, pct: d.stats.masteredPct }))
        .sort((a, b) => a.pct - b.pct)[0];
    return weakest
        ? t('statistics.insightLowest')
              .replace('{title}', weakest.title)
              .replace('{pct}', String(weakest.pct))
        : t('statistics.insightEmpty');
});

watch(range, async (r) => {
    await Promise.all([
        stats.load(r),
        stats.loadSeries(r),
        stats.loadStudyTime(r),
        stats.loadDecksStudied(r),
        stats.loadCardSeries(r),
    ]);
});

onMounted(async () => {
    await Promise.all([
        fetchList.execute({ cursor: null, append: false }),
        stats.load(range.value),
        stats.loadSeries(range.value),
        stats.loadStudyTime(range.value),
        stats.loadDecksStudied(range.value),
        stats.loadCardSeries(range.value),
        achievements.load(),
    ]);
});
</script>
