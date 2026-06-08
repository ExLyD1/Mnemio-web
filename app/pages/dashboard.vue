<template>
    <section class="mx-auto flex max-w-5xl flex-col gap-6 p-8">
        <header class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p class="text-eyebrow uppercase text-brand-muted">{{ todayLabel }}</p>
                <h1 class="mt-1 font-display text-display-sm text-cream">
                    {{ greeting }}<span v-if="name">, {{ name }}</span>
                </h1>
            </div>
            <p class="text-body text-cream-dim">
                <span class="font-semibold text-pink-soft">{{ dueToday }}</span>
                {{ t('dashboard.dueTodaySuffix') }}
            </p>
        </header>

        <DashboardContinueStudying
            v-if="resumeSession"
            :session="resumeSession"
            :deck-title="resumeDeckTitle"
            @resume="onResume"
        />

        <DashboardMostPracticed
            v-if="topDecks.length"
            :decks="topDecks"
            @practice="(id) => navigateTo(`/study/${id}`)"
        />

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SharedStatTile
                :label="t('dashboard.statDueToday')"
                :value="dueToday"
                :sub="t('dashboard.statDueSub')"
                tone="plum"
            />
            <SharedStatTile
                :label="t('dashboard.statReviewed')"
                :value="stats.reviewed.value"
                :sub="t('dashboard.statReviewedSub')"
            />
            <SharedStatTile :label="t('dashboard.statStreak')" :value="`${stats.streak.value}d`" />
            <SharedStatTile
                :label="t('dashboard.statRetention')"
                :value="`${stats.retention.value}%`"
            />
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
            <div
                v-if="featured"
                class="flex flex-col gap-4 rounded-[20px] border border-line bg-bg-surface p-5"
            >
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <p class="text-eyebrow uppercase text-brand-muted">
                            {{ t('dashboard.featuredDeck') }}
                        </p>
                        <h2 class="mt-1 font-display text-h2 text-cream">{{ featured.title }}</h2>
                        <p class="mt-0.5 text-small text-brand-muted">
                            {{ t('deck.cardCount').replace('{n}', String(featured.total)) }} ·
                            {{ featured.tag }}
                        </p>
                    </div>
                    <SharedPill v-if="featured.due > 0" tone="due">{{
                        t('dashboard.dueCount').replace('{n}', String(featured.due))
                    }}</SharedPill>
                </div>
                <div>
                    <SharedProgressBar :value="featured.masteredPct" />
                    <p class="mt-1.5 text-small text-brand-muted">
                        {{ t('dashboard.mastered').replace('{pct}', String(featured.masteredPct)) }}
                    </p>
                </div>
                <div class="mt-auto flex gap-2">
                    <UiButton
                        variant="ghost"
                        class="flex-1"
                        @click="navigateTo(`/decks/${featured.id}/cards/add`)"
                    >
                        {{ t('dashboard.addCards') }}
                    </UiButton>
                    <UiButton
                        variant="primary"
                        class="flex-1"
                        @click="navigateTo(`/study/${featured.id}`)"
                    >
                        {{ t('dashboard.practice') }}
                    </UiButton>
                </div>
            </div>

            <div class="rounded-[20px] border border-line bg-bg-surface p-5">
                <SharedMiniCalendar :weeks="weeks" :month-label="monthLabel" />
                <div class="mt-4 flex items-center gap-3 border-t border-line pt-4">
                    <Flame class="size-6 text-pink-soft" />
                    <div>
                        <p class="font-display text-xl text-cream">
                            {{
                                t('dashboard.dayStreak').replace('{n}', String(stats.streak.value))
                            }}
                        </p>
                        <p class="text-small text-brand-muted">{{ t('dashboard.keepGoing') }}</p>
                    </div>
                </div>
            </div>
        </div>

        <div
            class="flex flex-col items-center gap-5 rounded-[20px] border border-line bg-mimi-ambient p-6 sm:flex-row"
        >
            <SharedMimi
                :message="mimi.message.value"
                :mood="mimi.mood.value"
                placement="left"
                :size="96"
            />
            <div class="flex-1">
                <p class="text-eyebrow uppercase text-brand-pale">
                    {{ t('dashboard.mimiSuggests') }}
                </p>
                <p class="mt-1 text-body text-cream">{{ mimi.message.value }}</p>
            </div>
            <UiButton variant="primary" @click="navigateTo(suggestAction?.href ?? '/review')">
                {{ suggestAction?.label ?? t('dashboard.startReview') }}
            </UiButton>
        </div>

        <div v-if="recentVms.length">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="font-display text-h2 text-cream">{{ t('dashboard.recentDecks') }}</h2>
                <NuxtLink to="/decks" class="text-small text-lavender hover:underline">
                    {{ t('dashboard.viewAll') }}
                </NuxtLink>
            </div>
            <div class="flex gap-4 overflow-x-auto pb-2">
                <SharedDeckCard
                    v-for="vm in recentVms"
                    :key="vm.id"
                    :deck="vm"
                    variant="recent"
                    @practice="(id) => navigateTo(`/study/${id}`)"
                    @add-cards="(id) => navigateTo(`/decks/${id}/cards/add`)"
                />
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Flame } from 'lucide-vue-next';
import { useAuthStore, useDecks, useT } from '#imports';
import { useStats } from '@/composables/useStats';
import { useMimi } from '@/composables/useMimi';
import { useAppLocale } from '@/composables/useAppLocale';
import { useSessionsStore } from '@/stores/sessions';
import * as aiApi from '@/api/ai';
import * as statsApi from '@/api/stats';
import { deckToCardVm } from '@/utils/deckVm';
import { swatchFor } from '@/utils/coverSwatches';
import type { DeckCardVM } from '@/types/deck';
import type { DeckPerformance } from '@/types/stats';

definePageMeta({ layout: 'default' });

const auth = useAuthStore();
const { store, fetchList } = useDecks();
const stats = useStats();
const mimi = useMimi();
const sessions = useSessionsStore();
const { t } = useT();
const { current: locale } = useAppLocale();

const name = computed(() => auth.currentUser?.displayName ?? auth.currentUser?.username ?? '');
const dueToday = computed(() => store.summaries.reduce((sum, d) => sum + d.stats.due, 0));
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

const toVm = (deckId: string) => {
    const d = store.summaries.find((s) => s.id === deckId);
    if (!d) return null;
    return deckToCardVm(d);
};

const featured = computed(() => (store.summaries[0] ? toVm(store.summaries[0].id) : null));
const recentVms = computed(() => store.summaries.slice(0, 8).map((d) => deckToCardVm(d)));

// Quick continue — resume the last practiced deck (the active session, or the most
// recent one left unfinished).
const resumeSession = computed(() => sessions.active ?? sessions.latestIncomplete);
const resumeDeckTitle = computed(
    () => store.summaries.find((d) => d.id === resumeSession.value?.deckId)?.title ?? null,
);

const onResume = () => {
    const s = resumeSession.value;
    if (!s) {
        return;
    }
    if (s.mode === 'srs') {
        navigateTo('/review');
        return;
    }
    navigateTo(`/study/${s.deckId}/${s.mode}`);
};

// Most practiced — top decks by total reviews, with quick-start practice.
const deckPerf = ref<DeckPerformance[]>([]);
const topDecks = computed<DeckCardVM[]>(() =>
    [...deckPerf.value]
        .filter((p) => p.reviewed > 0)
        .sort((a, b) => b.reviewed - a.reviewed)
        .slice(0, 4)
        .map((p) => {
            const summary = store.summaries.find((s) => s.id === p.deckId);
            if (summary) {
                return { ...deckToCardVm(summary), reviewed: p.reviewed };
            }
            return {
                id: p.deckId,
                title: p.title,
                total: p.cardCount,
                masteredPct: p.masteryPct,
                due: 0,
                swatch: swatchFor(p.deckId),
                reviewed: p.reviewed,
            };
        }),
);

const weeks = computed(() => stats.monthWeeks.value);
const monthLabel = computed(() => stats.monthLabel.value);

onMounted(async () => {
    mimi.message.value = mimi.suggestion();
    await Promise.all([
        fetchList.execute({ cursor: null, append: false }),
        stats.load(),
        sessions.hydrate().catch(() => {}),
        statsApi
            .getDeckPerformance()
            .then((res) => {
                deckPerf.value = res.items;
            })
            .catch(() => {}),
    ]);
    try {
        const s = await aiApi.suggest('dashboard');
        // The backend suggestion text is English-only — keep our localized Mimi line
        // for non-English locales instead of leaking English copy into the banner.
        if (locale.value === 'en') {
            mimi.message.value = s.suggestion;
        }
        // FE-controlled route by kind — the backend's action.href (e.g. /decks/new)
        // doesn't match our routing.
        const href = s.kind === 'deck' ? '/decks/create' : '/review';
        const label =
            locale.value === 'en'
                ? (s.actions[0]?.label ?? t('dashboard.startReview'))
                : s.kind === 'deck'
                  ? t('deck.create')
                  : t('dashboard.startReview');
        suggestAction.value = { label, href };
    } catch {
        // keep the scripted fallback line already set above
    }
});
</script>
