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
import * as aiApi from '@/api/ai';
import { deckToCardVm } from '@/utils/deckVm';

definePageMeta({ layout: 'default' });

const auth = useAuthStore();
const { store, fetchList } = useDecks();
const stats = useStats();
const mimi = useMimi();
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

const weeks = computed(() => stats.monthWeeks.value);
const monthLabel = computed(() => stats.monthLabel.value);

onMounted(async () => {
    mimi.message.value = mimi.suggestion();
    await Promise.all([fetchList.execute({ cursor: null, append: false }), stats.load()]);
    try {
        const s = await aiApi.suggest('dashboard');
        mimi.message.value = s.suggestion;
        // Use the suggestion's label text, but a FE-controlled route by kind —
        // the backend's action.href (e.g. /decks/new) doesn't match our routing.
        const href = s.kind === 'deck' ? '/decks/create' : '/review';
        suggestAction.value = { label: s.actions[0]?.label ?? t('dashboard.startReview'), href };
    } catch {
        // keep the scripted fallback line already set above
    }
});
</script>
