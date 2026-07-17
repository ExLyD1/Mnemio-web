<template>
    <section class="mx-auto flex max-w-6xl flex-col gap-6 p-8">
        <header class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 class="font-display text-display-sm text-cream">{{ t('statistics.title') }}</h1>
                <p class="mt-1 text-body text-cream-dim">{{ t('statistics.subtitle') }}</p>
            </div>
            <UiSegmentedControl v-model="range" :options="rangeOptions" />
        </header>

        <div class="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
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
                tone="blue"
            />
            <SharedStatTile
                :label="t('statistics.recallRate')"
                :value="`${stats.retention.value}%`"
                :sub="t('statistics.recallRateSub')"
                :info="t('statistics.recallRateInfo')"
                tone="green"
            />
            <SharedStatTile
                :label="t('statistics.daysPracticed')"
                :value="daysPracticed"
                :sub="t('statistics.daysPracticedSub')"
                tone="pink"
            />
            <SharedStatTile
                :label="t('statistics.streak')"
                :value="stats.streak.value"
                :sub="t('statistics.streakSub')"
                tone="accent"
            />
            <SharedStatTile
                :label="t('statistics.wordsKnown')"
                :value="wordsKnown"
                :sub="t('statistics.wordsKnownSub')"
                tone="plain"
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

        <!-- Study trend + Performance (side by side on desktop, stacked on mobile) -->
        <div class="grid gap-6 lg:grid-cols-2">
            <!-- Study trend: reviews / time toggle -->
            <div class="rounded-[20px] border border-line bg-bg-surface p-5">
                <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p class="text-eyebrow uppercase text-brand-muted">
                            {{ t('statistics.studyTrend') }}
                        </p>
                        <p class="mt-1 font-display text-base text-cream">{{ trendSummary }}</p>
                    </div>
                    <UiSegmentedControl v-model="trendMode" :options="trendOptions" />
                </div>
                <div class="flex h-40 items-end gap-1">
                    <div
                        v-for="(d, i) in trendPoints"
                        :key="i"
                        class="group relative flex h-full flex-1 items-end rounded-t bg-brand/10"
                    >
                        <div
                            class="w-full rounded-t transition-all group-hover:brightness-110"
                            :class="
                                i === trendPoints.length - 1
                                    ? 'bg-pink-soft'
                                    : trendMode === 'time'
                                      ? 'bg-lavender'
                                      : 'bg-vib-pink'
                            "
                            :style="{ height: barHeight(d.value) }"
                        />
                        <div
                            class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-line-strong bg-bg-surface-2 px-2.5 py-1.5 text-center shadow-lg group-hover:block"
                        >
                            <span
                                class="block text-[10px] uppercase tracking-wide text-brand-muted"
                            >
                                {{ formatBarLabel(d.label, trendPoints.length) }}
                            </span>
                            <span class="block text-small font-semibold text-cream">
                                {{ trendTooltip(d) }}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="relative mt-1 flex gap-1">
                    <div v-for="(d, i) in trendPoints" :key="i" class="flex-1">
                        <template v-if="showBarLabel(i, trendPoints.length)">
                            <div class="mx-auto h-1.5 w-px bg-line" />
                            <div class="text-center text-[10px] leading-tight text-brand-muted">
                                {{ formatBarLabel(d.label, trendPoints.length) }}
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <!-- Performance: recall distribution vs other learners -->
            <div class="rounded-[20px] border border-line bg-bg-surface p-5">
                <div class="mb-1 flex items-center justify-between gap-3">
                    <p class="text-eyebrow uppercase text-brand-muted">
                        {{ t('statistics.performance') }}
                    </p>
                    <span v-if="perf?.enoughData" class="text-small font-semibold text-vib-pink">
                        {{
                            t('statistics.performanceTop').replace(
                                '{n}',
                                String(100 - perf.percentile),
                            )
                        }}
                    </span>
                </div>
                <p class="mb-4 text-small text-brand-muted">{{ t('statistics.performanceSub') }}</p>

                <!-- Enough learners: real recall distribution -->
                <div v-if="perf?.enoughData">
                    <svg
                        :viewBox="`0 0 ${PERF_W} ${PERF_H}`"
                        class="w-full"
                        style="height: 150px"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <path :d="perfArea" class="fill-vib-pink opacity-[.15]" />
                        <polyline
                            :points="perfLine"
                            fill="none"
                            class="stroke-cream"
                            stroke-width="2"
                            stroke-linejoin="round"
                        />
                        <line
                            :x1="perfMarkerX"
                            y1="6"
                            :x2="perfMarkerX"
                            :y2="PERF_H"
                            class="stroke-vib-pink"
                            stroke-width="2"
                            stroke-dasharray="4 3"
                        />
                        <circle :cx="perfMarkerX" :cy="perfMarkerY" r="4" class="fill-vib-pink" />
                    </svg>
                    <div class="mt-2 flex items-center justify-between text-small text-brand-muted">
                        <span class="font-semibold text-cream">{{
                            t('statistics.performanceYou').replace('{n}', String(perf.userRecall))
                        }}</span>
                        <span>{{
                            t('statistics.performancePeers').replace('{n}', String(perf.sampleSize))
                        }}</span>
                    </div>
                </div>

                <!-- Not enough learners yet -->
                <div v-else class="flex flex-col items-center gap-3 py-10 text-center">
                    <Users class="size-6 text-brand-muted opacity-50" />
                    <p class="max-w-xs text-body text-brand-muted">
                        {{ t('statistics.performanceEmpty') }}
                    </p>
                </div>
            </div>
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
import { Trophy, Lock, Users } from 'lucide-vue-next';
import { useDecks, useT } from '#imports';
import { useStats } from '@/composables/useStats';
import { useAchievements } from '@/composables/useAchievements';
import type { StatsRange, StatsSeriesPoint } from '@/types/stats';

definePageMeta({ layout: 'default' });

const { store, fetchList } = useDecks();
const { t } = useT();
const stats = useStats();

useSeo({ title: t('seo.statisticsTitle'), description: t('seo.appDesc'), noindex: true });
const achievements = useAchievements();
const dueTotal = computed(() => store.summaries.reduce((sum, d) => sum + d.stats.due, 0));

// Words known ≈ cards mastered across all decks (mature cards).
const wordsKnown = computed(() =>
    store.summaries.reduce(
        (sum, d) => sum + Math.round((d.cardCount * d.stats.masteredPct) / 100),
        0,
    ),
);

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

const msToMin = (ms: number): number => Math.round(ms / 60000);

// Study trend: one chart that toggles between cards reviewed and time studied.
type TrendMode = 'cards' | 'time';
const trendMode = ref<TrendMode>('cards');
const trendOptions = computed(() => [
    { value: 'cards', label: t('statistics.trendCards') },
    { value: 'time', label: t('statistics.trendTime') },
]);
const trendPoints = computed<StatsSeriesPoint[]>(() =>
    trendMode.value === 'time' ? stats.studyTime.value : stats.series.value,
);
const trendMax = computed(() => Math.max(1, ...trendPoints.value.map((d) => d.value)));
// Keep any non-zero day visible with a small floor height.
const barHeight = (v: number): string =>
    v <= 0 ? '0%' : `max(${(v / trendMax.value) * 100}%, 6px)`;
const trendTooltip = (d: StatsSeriesPoint): string =>
    trendMode.value === 'time'
        ? `${msToMin(d.value)} ${t('statistics.studyTimeUnit')}`
        : t('statistics.dsCardsReviewed').replace('{n}', String(d.value));
const trendTotal = computed(() => trendPoints.value.reduce((sum, d) => sum + d.value, 0));
const trendSummary = computed(() =>
    trendMode.value === 'time'
        ? t('statistics.trendTotalTime').replace('{n}', String(msToMin(trendTotal.value)))
        : t('statistics.trendTotalCards').replace('{n}', String(trendTotal.value)),
);

// Performance: build the recall-distribution curve from the backend buckets.
const PERF_W = 340;
const PERF_H = 130;
const perf = computed(() => stats.performance.value);
const perfPoints = computed<{ x: number; y: number }[]>(() => {
    const b = perf.value?.buckets ?? [];
    if (b.length < 2) return [];
    const maxC = Math.max(1, ...b);
    return b.map((c, i) => ({
        x: (i / (b.length - 1)) * PERF_W,
        y: PERF_H - 6 - (c / maxC) * (PERF_H - 16),
    }));
});
const perfLine = computed(() => perfPoints.value.map((p) => `${p.x},${p.y}`).join(' '));
const perfArea = computed(() => {
    const pts = perfPoints.value;
    if (!pts.length) return '';
    const body = pts.map((p) => `${p.x} ${p.y}`).join(' L ');
    return `M ${pts[0]!.x} ${PERF_H} L ${body} L ${pts[pts.length - 1]!.x} ${PERF_H} Z`;
});
const perfMarkerX = computed(() => ((perf.value?.userRecall ?? 0) / 100) * PERF_W);
const perfMarkerY = computed(() => {
    const pts = perfPoints.value;
    if (pts.length < 2) return PERF_H;
    const x = perfMarkerX.value;
    for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1]!;
        const b = pts[i]!;
        if (x <= b.x) {
            const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
            return a.y + (b.y - a.y) * t;
        }
    }
    return pts[pts.length - 1]!.y;
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
        stats.loadPerformance(r),
    ]);
});

onMounted(async () => {
    await Promise.all([
        fetchList.execute({ cursor: null, append: false }),
        stats.load(range.value),
        stats.loadSeries(range.value),
        stats.loadStudyTime(range.value),
        stats.loadPerformance(range.value),
        achievements.load(),
    ]);
});
</script>
