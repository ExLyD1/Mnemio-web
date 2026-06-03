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
                :label="t('statistics.reviewed')"
                :value="stats.reviewed.value"
                :sub="t('statistics.reviewedSub')"
                :trend="reviewedTrend"
            />
            <SharedStatTile
                :label="t('statistics.retention')"
                :value="`${stats.retention.value}%`"
                :trend="retentionTrend"
                tone="accent"
            />
            <SharedStatTile :label="t('statistics.streak')" :value="`${stats.streak.value}d`" />
            <SharedStatTile :label="t('statistics.due')" :value="dueTotal" tone="plum" />
        </div>

        <div class="rounded-[20px] border border-line bg-bg-surface p-5">
            <p class="mb-3 text-eyebrow uppercase text-brand-muted">
                {{ t('statistics.activity') }}
            </p>
            <SharedActivityHeatmap :weeks="heat" />
        </div>

        <div class="rounded-[20px] border border-line bg-bg-surface p-5">
            <p class="mb-4 text-eyebrow uppercase text-brand-muted">
                {{ t('statistics.cardsReviewed') }}
            </p>
            <div class="flex h-40 items-end gap-1">
                <div
                    v-for="(d, i) in series"
                    :key="i"
                    class="flex-1 rounded-t bg-brand transition-all hover:bg-brand-bright"
                    :style="{ height: `${(d.value / maxValue) * 100}%` }"
                    :title="`${d.label}: ${d.value}`"
                />
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
                    class="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
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
                        :class="a.earned ? 'text-pink-soft' : 'text-brand-muted'"
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
import { Trophy, Lock } from 'lucide-vue-next';
import { useDecks, useT } from '#imports';
import { useStats } from '@/composables/useStats';
import { useAchievements } from '@/composables/useAchievements';
import type { StatsRange, StatsTrend } from '@/types/stats';

definePageMeta({ layout: 'default' });

const { store, fetchList } = useDecks();
const { t } = useT();
const stats = useStats();
const achievements = useAchievements();
const dueTotal = computed(() => store.summaries.reduce((sum, d) => sum + d.stats.due, 0));

const range = ref<StatsRange>('30');
const rangeOptions = computed(() => [
    { value: '7', label: t('statistics.range7') },
    { value: '30', label: t('statistics.range30') },
    { value: '90', label: t('statistics.range90') },
    { value: 'all', label: t('statistics.rangeAll') },
]);

const series = computed(() => stats.series.value);
const maxValue = computed(() => Math.max(1, ...series.value.map((d) => d.value)));
const heat = computed(() => stats.yearHeat.value);

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
    await Promise.all([stats.load(r), stats.loadSeries(r)]);
});

onMounted(async () => {
    await Promise.all([
        fetchList.execute({ cursor: null, append: false }),
        stats.load(range.value),
        stats.loadSeries(range.value),
        achievements.load(),
    ]);
});
</script>
