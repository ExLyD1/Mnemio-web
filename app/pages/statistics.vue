<template>
    <section class="mx-auto flex max-w-6xl flex-col gap-6 p-8">
        <header class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 class="font-display text-display-sm text-cream">Your statistics.</h1>
                <p class="mt-1 text-body text-cream-dim">How your memory is trending over time.</p>
            </div>
            <UiSegmentedControl v-model="range" :options="rangeOptions" />
        </header>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SharedStatTile
                label="Reviewed"
                :value="statsApi.reviewedToday.value"
                sub="today"
                :trend="{ dir: 'up', label: '+12%' }"
            />
            <SharedStatTile
                label="Retention"
                :value="`${statsApi.retention.value}%`"
                :trend="{ dir: 'up', label: '+3%' }"
                tone="accent"
            />
            <SharedStatTile label="Streak" :value="`${statsApi.streak.value}d`" />
            <SharedStatTile label="Due" :value="srs.dueCount" tone="plum" />
        </div>

        <div class="rounded-[20px] border border-line bg-bg-surface p-5">
            <p class="mb-3 text-eyebrow uppercase text-brand-muted">Activity</p>
            <SharedActivityHeatmap :weeks="heat" />
        </div>

        <div class="rounded-[20px] border border-line bg-bg-surface p-5">
            <p class="mb-4 text-eyebrow uppercase text-brand-muted">Cards reviewed</p>
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
            <p class="mb-4 text-eyebrow uppercase text-brand-muted">Deck performance</p>
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
                    <span class="text-small text-brand-muted">{{ d.cardCount }} cards</span>
                    <span class="w-28">
                        <SharedProgressBar :value="stats.forDeck(d.id, d.cardCount).masteredPct" />
                    </span>
                </div>
            </div>
            <p v-else class="text-body text-brand-muted">No decks yet.</p>
        </div>

        <div class="rounded-[20px] border border-line bg-bg-surface p-5">
            <p class="mb-4 text-eyebrow uppercase text-brand-muted">Achievements</p>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div
                    v-for="a in statsApi.achievements"
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
                    <span class="text-small text-brand-muted">{{ a.note }}</span>
                </div>
            </div>
        </div>

        <div
            class="flex flex-col items-center gap-5 rounded-[20px] border border-line bg-mimi-ambient p-6 text-center sm:flex-row sm:text-left"
        >
            <SharedMimi :size="96" placement="left" />
            <div class="flex-1">
                <p class="text-eyebrow uppercase text-brand-pale">Mimi noticed something</p>
                <p class="mt-1 text-body text-cream">{{ insight }}</p>
            </div>
            <UiButton variant="primary" @click="navigateTo('/review')"
                >Start a hint session</UiButton
            >
        </div>
    </section>
</template>

<script setup lang="ts">
import { Trophy, Lock } from 'lucide-vue-next';
import { useDecks, useSrsStore } from '#imports';
import { useStats } from '@/composables/useStats';
import { useDeckStats } from '@/composables/useDeckStats';

definePageMeta({ layout: 'default' });

const { store, fetchList } = useDecks();
const srs = useSrsStore();
const statsApi = useStats();
const stats = useDeckStats();

const range = ref('30');
const rangeOptions = [
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
    { value: 'all', label: 'All time' },
];

const rangeDays = computed(() => (range.value === 'all' ? 90 : Number(range.value)));
const series = computed(() => statsApi.dailySeries(rangeDays.value));
const maxValue = computed(() => Math.max(1, ...series.value.map((d) => d.value)));
const heat = computed(() => statsApi.yearHeat());

const insight = computed(() => {
    const weakest = store.summaries
        .map((d) => ({ title: d.title, pct: stats.forDeck(d.id, d.cardCount).masteredPct }))
        .sort((a, b) => a.pct - b.pct)[0];
    return weakest
        ? `“${weakest.title}” is your lowest deck at ${weakest.pct}% mastered — a quick session would help.`
        : 'Create a deck and start studying to unlock insights.';
});

onMounted(async () => {
    await fetchList.execute({ cursor: null, append: false });
    await srs.fetchAll();
});
</script>
