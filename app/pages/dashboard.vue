<template>
    <section class="mx-auto flex max-w-[920px] flex-col gap-6 p-6 lg:p-8">
        <header>
            <p class="text-eyebrow uppercase text-brand-muted">{{ todayLabel }}</p>
            <h1 class="mt-1 font-display text-display-sm text-cream">
                {{ greeting }}<span v-if="name" class="italic text-lavender">, {{ name }}.</span>
            </h1>
        </header>

        <DashboardContinueStudying
            v-if="resumeSession"
            :session="resumeSession"
            :deck-title="resumeDeckTitle"
            @resume="onResume"
        />

        <!-- Hero: today's review -->
        <div
            class="rounded-[24px] border border-[rgba(242,188,255,0.18)] px-9 py-8"
            :style="{ background: heroGradient }"
        >
            <!-- Content -->
            <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                    <p class="text-eyebrow uppercase text-brand-pale">
                        {{ t('dashboard.todayReview') }}
                    </p>
                    <h2 class="mt-2 font-display text-[34px] leading-tight text-cream">
                        {{ dueCount }} {{ t('dashboard.cardsShort') }}
                        <span class="text-cream/60">·</span>
                        {{ t('dashboard.aboutMinutes').replace('{n}', String(reviewMins)) }}
                    </h2>
                    <div class="mt-5">
                        <UiButton
                            variant="primary"
                            class="gap-1.5"
                            @click="navigateTo(suggestAction?.href ?? '/review')"
                        >
                            {{ suggestAction?.label ?? t('dashboard.startReview') }}
                            <ArrowRight class="size-4" />
                        </UiButton>
                    </div>
                </div>
            </div>
        </div>

        <!-- Two-column body -->
        <div class="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <!-- Up next -->
            <div class="flex flex-col rounded-[20px] border border-line bg-bg-surface">
                <div class="border-b border-line px-5 py-4">
                    <p class="text-eyebrow uppercase text-brand-muted">
                        {{ t('dashboard.upNext') }}
                    </p>
                </div>

                <!-- Deck rows -->
                <div v-if="upNextDecks.length" class="flex flex-1 flex-col">
                    <div
                        v-for="deck in upNextDecks"
                        :key="deck.id"
                        class="flex items-center gap-3 border-b border-line px-5 py-3 transition-colors last:border-b-0 dark:hover:bg-white/[0.02] hover:bg-brand/5"
                    >
                        <div
                            class="h-9 w-2.5 shrink-0 rounded-full"
                            :style="{ background: deck.swatch }"
                        />
                        <div class="min-w-0 flex-1">
                            <p class="truncate font-display text-base text-cream">
                                {{ deck.title }}
                            </p>
                            <p class="text-small text-brand-muted">
                                {{
                                    t('dashboard.mastered').replace(
                                        '{pct}',
                                        String(deck.masteredPct),
                                    )
                                }}
                            </p>
                        </div>
                        <div class="flex shrink-0 items-center gap-2">
                            <span v-if="deck.due > 0" class="text-xs font-bold text-pink-soft"
                                >{{ deck.due }} {{ t('dashboard.dueShort') }}</span
                            >
                            <UiButton
                                variant="primary"
                                class="!py-1.5 !text-small"
                                @click="navigateTo(`/study/${deck.id}`)"
                            >
                                {{ t('dashboard.practice') }}
                            </UiButton>
                        </div>
                    </div>
                    <div class="px-5 py-3">
                        <NuxtLink to="/decks" class="text-small text-lavender hover:underline">
                            {{ t('dashboard.allDecks') }} →
                        </NuxtLink>
                    </div>
                </div>

                <!-- Empty state -->
                <div
                    v-else
                    class="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center"
                >
                    <SharedMimi mood="done" :size="56" />
                    <p class="text-body text-brand-muted">{{ t('dashboard.allCaughtUp') }}</p>
                </div>
            </div>

            <!-- This week -->
            <div class="flex flex-col gap-4 rounded-[20px] border border-line bg-bg-surface p-5">
                <p class="text-eyebrow uppercase text-brand-muted">{{ t('dashboard.thisWeek') }}</p>

                <!-- 7-day pips -->
                <div class="flex justify-between">
                    <div
                        v-for="(pt, i) in weekSeries"
                        :key="i"
                        class="flex flex-col items-center gap-1.5"
                    >
                        <div
                            class="grid size-8 place-items-center rounded-full text-[11px] font-bold transition-all"
                            :class="
                                pt.value > 0
                                    ? isToday(i)
                                        ? 'border border-pink/40 bg-gradient-to-b from-brand-bright to-plum text-cream shadow-md'
                                        : 'border border-pink/30 bg-gradient-to-b from-brand-bright to-plum text-cream'
                                    : 'border border-line dark:bg-white/[0.03] bg-brand/5 text-cream-faint'
                            "
                        >
                            {{ pt.value > 0 ? pt.value : '' }}
                        </div>
                        <span class="text-[10px] leading-none tracking-wide text-cream-faint">{{
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
                        <div class="flex items-center gap-2">
                            <span class="text-small text-cream"
                                >{{ weekReviewed }} / {{ weekGoal }}
                                {{ t('dashboard.cards') }}</span
                            >
                            <NuxtLink
                                to="/profile"
                                class="text-brand-muted transition-colors hover:text-cream"
                                :aria-label="t('dashboard.editGoal')"
                            >
                                <Settings class="size-3.5" />
                            </NuxtLink>
                        </div>
                    </div>
                    <div class="h-1.5 w-full overflow-hidden rounded-full bg-line">
                        <div
                            class="h-full rounded-full transition-[width] duration-500 ease-out"
                            :style="{
                                width: `${weekGoalPct}%`,
                                background: 'linear-gradient(90deg, #7c4576, #c2e083)',
                            }"
                        />
                    </div>
                </div>

                <!-- Stats row -->
                <div class="flex gap-6 border-t border-line pt-4">
                    <div>
                        <p class="font-display text-h2 leading-none text-cream">
                            {{ daysPracticed }}
                        </p>
                        <p class="mt-1 text-small text-brand-muted">
                            {{ t('dashboard.daysPracticed') }}
                        </p>
                    </div>
                    <div class="w-px bg-line" />
                    <div>
                        <p class="font-display text-h2 leading-none text-cream">
                            {{ weekReviewed.toLocaleString() }}
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
import { ArrowRight, Settings } from 'lucide-vue-next';
import { useAuthStore, useDecks, useT } from '#imports';
import { useStats } from '@/composables/useStats';
import { useAppLocale } from '@/composables/useAppLocale';
import { useSessionsStore } from '@/stores/sessions';
import { useSrsStore } from '@/stores/srs';
import { usePreferencesStore } from '@/stores/preferences';
import * as aiApi from '@/api/ai';
import * as statsApi from '@/api/stats';
import { deckToCardVm } from '@/utils/deckVm';

definePageMeta({ layout: 'default' });

const colorMode = useColorMode();
const heroGradient = computed(() =>
    colorMode.value === 'dark'
        ? 'linear-gradient(160deg, #572f54 0%, #2c1a2a 100%)'
        : 'linear-gradient(160deg, #ede4f8 0%, #d4b8f0 100%)',
);

const auth = useAuthStore();
const { store, fetchList } = useDecks();
const stats = useStats();
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

// Hero derived values — ~35 sec per card average
const reviewMins = computed(() => Math.max(1, Math.ceil((dueCount.value * 35) / 60)));
const topDueDeck = computed(
    () =>
        store.summaries
            .filter((d) => d.stats.due > 0)
            .sort((a, b) => b.stats.due - a.stats.due)[0] ?? null,
);
const heroSubtitle = computed(() => {
    if (!topDueDeck.value) return '';
    return t('dashboard.mostlyFrom').replace('{deck}', topDueDeck.value.title);
});

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

// This week — last 7 points of series, with 2-char day labels derived client-side
const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
const weekSeries = computed(() => {
    const pts = stats.series.value.slice(-7);
    const today = new Date();
    return pts.map((pt, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (pts.length - 1 - i));
        return { value: pt.value, label: DAY_ABBR[d.getDay()] as string };
    });
});
const weekReviewed = computed(() => weekSeries.value.reduce((sum, p) => sum + p.value, 0));
const daysPracticed = computed(() => weekSeries.value.filter((p) => p.value > 0).length);
// Highlight today's pip (last point in the 7-day series is today)
const isToday = (i: number) => i === weekSeries.value.length - 1;

const goalMap: Record<string, number> = { casual: 50, steady: 100, serious: 250 };
const weekGoal = computed(() => goalMap[prefs.goal ?? 'steady'] ?? 100);
const weekGoalPct = computed(() =>
    Math.min(100, Math.round((weekReviewed.value / weekGoal.value) * 100)),
);

onMounted(async () => {
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
