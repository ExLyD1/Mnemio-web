<template>
    <section class="mx-auto flex max-w-5xl flex-col gap-6 p-6 lg:p-8">
        <header>
            <p class="text-eyebrow uppercase text-brand-muted">{{ todayLabel }}</p>
            <h1 class="mt-1 font-display text-display-sm text-cream">
                {{ greeting }}<span v-if="name">, {{ name }}</span>
            </h1>
        </header>

        <DashboardContinueStudying
            v-if="resumeSession"
            :session="resumeSession"
            :deck-title="resumeDeckTitle"
            @resume="onResume"
        />

        <!-- Hero: today's review -->
        <div class="overflow-hidden rounded-[24px] border border-line bg-bg-surface">
            <div class="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-6">
                <SharedMimi
                    :message="mimi.message.value"
                    :mood="mimi.mood.value"
                    placement="left"
                    :size="80"
                    class="shrink-0"
                />
                <div class="min-w-0 flex-1">
                    <p class="text-eyebrow uppercase text-brand-muted">
                        {{ t('dashboard.todayReview') }}
                    </p>
                    <div class="mt-1 flex items-baseline gap-2">
                        <span class="font-display text-display-sm text-cream">{{ dueCount }}</span>
                        <span class="text-body text-cream-dim">{{
                            t('dashboard.cardsToReview')
                        }}</span>
                    </div>
                    <p
                        v-if="mimi.message.value"
                        class="mt-1 line-clamp-1 text-small text-brand-muted"
                    >
                        {{ mimi.message.value }}
                    </p>
                </div>
                <UiButton
                    variant="primary"
                    class="shrink-0"
                    @click="navigateTo(suggestAction?.href ?? '/review')"
                >
                    {{ suggestAction?.label ?? t('dashboard.startReview') }}
                </UiButton>
            </div>
        </div>

        <!-- Two-column body -->
        <div class="grid gap-6 lg:grid-cols-2">
            <!-- Up next: decks with due cards -->
            <div class="flex flex-col gap-3">
                <h2 class="font-display text-h2 text-cream">{{ t('dashboard.upNext') }}</h2>
                <div v-if="upNextDecks.length" class="flex flex-col gap-2">
                    <div
                        v-for="deck in upNextDecks"
                        :key="deck.id"
                        class="flex items-center gap-3 rounded-2xl border border-line bg-bg-surface p-3 transition-colors hover:border-brand-bright/40"
                    >
                        <div
                            class="h-10 w-1.5 shrink-0 rounded-full"
                            :style="{ backgroundImage: deck.swatch }"
                        />
                        <div class="min-w-0 flex-1">
                            <p class="truncate font-display text-base text-cream">
                                {{ deck.title }}
                            </p>
                            <div class="mt-1 flex items-center gap-2">
                                <SharedProgressBar :value="deck.masteredPct" class="w-16" />
                                <span class="text-small text-brand-muted"
                                    >{{ deck.masteredPct }}%</span
                                >
                            </div>
                        </div>
                        <div class="flex shrink-0 items-center gap-2">
                            <SharedPill v-if="deck.due > 0" tone="due">{{ deck.due }}</SharedPill>
                            <UiButton
                                variant="ghost"
                                class="!py-1.5 !text-small"
                                @click="navigateTo(`/study/${deck.id}`)"
                            >
                                {{ t('dashboard.practice') }}
                            </UiButton>
                        </div>
                    </div>
                </div>
                <div
                    v-else
                    class="flex flex-col items-center gap-3 rounded-[20px] border border-line bg-bg-surface px-4 py-8 text-center"
                >
                    <SharedMimi mood="done" :size="56" />
                    <p class="text-body text-brand-muted">{{ t('dashboard.allCaughtUp') }}</p>
                </div>
            </div>

            <!-- This week -->
            <div class="flex flex-col gap-4 rounded-[20px] border border-line bg-bg-surface p-5">
                <h2 class="font-display text-h2 text-cream">{{ t('dashboard.thisWeek') }}</h2>

                <!-- 7-day bar strip -->
                <div class="flex h-16 items-end gap-1">
                    <div
                        v-for="(pt, i) in weekSeries"
                        :key="i"
                        class="flex flex-1 flex-col items-center gap-0.5"
                    >
                        <div
                            class="min-h-[3px] w-full rounded-t-sm bg-brand transition-all hover:bg-brand-bright"
                            :style="{ height: `${weekBarHeight(pt.value)}px` }"
                            :title="`${pt.label}: ${pt.value}`"
                        />
                        <span class="text-[10px] leading-none text-brand-muted">{{
                            pt.label
                        }}</span>
                    </div>
                </div>

                <!-- Weekly goal bar -->
                <div>
                    <div class="mb-1.5 flex items-center justify-between">
                        <span class="text-small text-brand-muted">{{
                            t('dashboard.weeklyGoal')
                        }}</span>
                        <span class="text-small text-cream"
                            >{{ weekReviewed }} / {{ weekGoal }}</span
                        >
                    </div>
                    <SharedProgressBar :value="weekGoalPct" />
                </div>

                <!-- Stats row -->
                <div class="flex gap-4 border-t border-line pt-4">
                    <div class="flex-1 text-center">
                        <p class="font-display text-h2 leading-none text-cream">
                            {{ daysPracticed }}
                        </p>
                        <p class="mt-1 text-small text-brand-muted">
                            {{ t('dashboard.daysPracticed') }}
                        </p>
                    </div>
                    <div class="w-px bg-line" />
                    <div class="flex-1 text-center">
                        <p class="font-display text-h2 leading-none text-cream">
                            {{ weekReviewed }}
                        </p>
                        <p class="mt-1 text-small text-brand-muted">
                            {{ t('dashboard.cardsReviewed') }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { useAuthStore, useDecks, useT } from '#imports';
import { useStats } from '@/composables/useStats';
import { useMimi } from '@/composables/useMimi';
import { useAppLocale } from '@/composables/useAppLocale';
import { useSessionsStore } from '@/stores/sessions';
import { useSrsStore } from '@/stores/srs';
import { usePreferencesStore } from '@/stores/preferences';
import * as aiApi from '@/api/ai';
import * as statsApi from '@/api/stats';
import { deckToCardVm } from '@/utils/deckVm';

definePageMeta({ layout: 'default' });

const auth = useAuthStore();
const { store, fetchList } = useDecks();
const stats = useStats();
const mimi = useMimi();
const sessions = useSessionsStore();
const srs = useSrsStore();
const prefs = usePreferencesStore();
const { t } = useT();
const { current: locale } = useAppLocale();

useSeo({ title: t('seo.dashboardTitle'), description: t('seo.appDesc'), noindex: true });

const name = computed(() => auth.currentUser?.displayName ?? auth.currentUser?.username ?? '');
const dueCount = computed(() => srs.dueCount);
const suggestAction = ref<{ label: string; href: string } | null>(null);

const greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 18) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
});

const todayLabel = computed(() =>
    new Date().toLocaleDateString(locale.value === 'uk' ? 'uk-UA' : 'en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }),
);

// Up next: decks with due cards, sorted by due desc, max 5
const upNextDecks = computed(() =>
    store.summaries
        .filter((d) => d.stats.due > 0)
        .sort((a, b) => b.stats.due - a.stats.due)
        .slice(0, 5)
        .map((d) => deckToCardVm(d)),
);

// Continue studying
const resumeSession = computed(() => sessions.active ?? sessions.latestIncomplete);
const resumeDeckTitle = computed(
    () => store.summaries.find((d) => d.id === resumeSession.value?.deckId)?.title ?? null,
);

const onResume = () => {
    const s = resumeSession.value;
    if (!s) return;
    if (s.mode === 'srs') {
        navigateTo('/review');
        return;
    }
    navigateTo(`/study/${s.deckId}/${s.mode}`);
};

// This week — last 7 points of series
const weekSeries = computed(() => stats.series.value.slice(-7));
const weekReviewed = computed(() => weekSeries.value.reduce((sum, p) => sum + p.value, 0));
const daysPracticed = computed(() => weekSeries.value.filter((p) => p.value > 0).length);
const maxWeekValue = computed(() => Math.max(1, ...weekSeries.value.map((p) => p.value)));
const weekBarHeight = (v: number) => Math.round((v / maxWeekValue.value) * 44);

const goalMap: Record<string, number> = { casual: 50, steady: 100, serious: 250 };
const weekGoal = computed(() => goalMap[prefs.goal ?? 'steady'] ?? 100);
const weekGoalPct = computed(() =>
    Math.min(100, Math.round((weekReviewed.value / weekGoal.value) * 100)),
);

onMounted(async () => {
    mimi.message.value = mimi.suggestion();
    await Promise.all([
        fetchList.execute({ cursor: null, append: false }),
        stats.load(),
        stats.loadSeries('7'),
        sessions.hydrate().catch(() => {}),
        srs.fetchAll().catch(() => {}),
        prefs.hydrate().catch(() => {}),
    ]);
    try {
        const s = await aiApi.suggest('dashboard');
        if (locale.value === 'en') {
            mimi.message.value = s.suggestion;
        }
        const href = s.kind === 'deck' ? '/decks/create' : '/review';
        const label =
            locale.value === 'en'
                ? (s.actions[0]?.label ?? t('dashboard.startReview'))
                : s.kind === 'deck'
                  ? t('deck.create')
                  : t('dashboard.startReview');
        suggestAction.value = { label, href };
    } catch {
        // keep scripted fallback
    }
    statsApi.getDeckPerformance().catch(() => {});
});
</script>
