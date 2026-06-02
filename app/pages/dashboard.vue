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
                <span class="font-semibold text-pink-soft">{{ srs.dueCount }}</span> due today
            </p>
        </header>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SharedStatTile label="Due today" :value="srs.dueCount" sub="cards" tone="plum" />
            <SharedStatTile label="Reviewed" :value="statsApi.reviewedToday.value" sub="today" />
            <SharedStatTile label="Streak" :value="`${statsApi.streak.value}d`" />
            <SharedStatTile label="Retention" :value="`${statsApi.retention.value}%`" />
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
            <div
                v-if="featured"
                class="flex flex-col gap-4 rounded-[20px] border border-line bg-bg-surface p-5"
            >
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <p class="text-eyebrow uppercase text-brand-muted">Featured deck</p>
                        <h2 class="mt-1 font-display text-h2 text-cream">{{ featured.title }}</h2>
                        <p class="mt-0.5 text-small text-brand-muted">
                            {{ featured.total }} cards · {{ featured.tag }}
                        </p>
                    </div>
                    <SharedPill v-if="featured.due > 0" tone="due"
                        >{{ featured.due }} due</SharedPill
                    >
                </div>
                <div>
                    <SharedProgressBar :value="featured.masteredPct" />
                    <p class="mt-1.5 text-small text-brand-muted">
                        {{ featured.masteredPct }}% mastered
                    </p>
                </div>
                <div class="mt-auto flex gap-2">
                    <UiButton
                        variant="ghost"
                        class="flex-1"
                        @click="navigateTo(`/decks/${featured.id}/cards/add`)"
                    >
                        Add cards
                    </UiButton>
                    <UiButton
                        variant="primary"
                        class="flex-1"
                        @click="navigateTo(`/study/${featured.id}`)"
                    >
                        Practice
                    </UiButton>
                </div>
            </div>

            <div class="rounded-[20px] border border-line bg-bg-surface p-5">
                <SharedMiniCalendar
                    :weeks="weeks"
                    :month-label="monthLabel"
                    @prev="prevMonth"
                    @next="nextMonth"
                />
                <div class="mt-4 flex items-center gap-3 border-t border-line pt-4">
                    <Flame class="size-6 text-pink-soft" />
                    <div>
                        <p class="font-display text-xl text-cream">
                            {{ statsApi.streak.value }} day streak
                        </p>
                        <p class="text-small text-brand-muted">Keep it going today.</p>
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
                <p class="text-eyebrow uppercase text-brand-pale">Mimi suggests</p>
                <p class="mt-1 text-body text-cream">{{ mimi.message.value }}</p>
            </div>
            <UiButton variant="primary" @click="navigateTo('/review')">Start review</UiButton>
        </div>

        <div v-if="recentVms.length">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="font-display text-h2 text-cream">Recent decks</h2>
                <NuxtLink to="/decks" class="text-small text-lavender hover:underline">
                    View all
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
import { useAuthStore, useDecks, useSrsStore, useT } from '#imports';
import { useDeckStats } from '@/composables/useDeckStats';
import { useStats } from '@/composables/useStats';
import { useMimi } from '@/composables/useMimi';
import { deckToCardVm } from '@/utils/deckVm';

definePageMeta({ layout: 'default' });

const auth = useAuthStore();
const { store, fetchList } = useDecks();
const srs = useSrsStore();
const stats = useDeckStats();
const statsApi = useStats();
const mimi = useMimi();
const { t } = useT();

const name = computed(() => auth.currentUser?.displayName ?? auth.currentUser?.username ?? '');

const greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 18) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
});

const todayLabel = computed(() =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
);

const toVm = (deckId: string) => {
    const d = store.summaries.find((s) => s.id === deckId);
    if (!d) return null;
    return deckToCardVm(d, stats.forDeck(d.id, d.cardCount));
};

const featured = computed(() => (store.summaries[0] ? toVm(store.summaries[0].id) : null));
const recentVms = computed(() =>
    store.summaries
        .slice(0, 8)
        .map((d) => deckToCardVm(d, stats.forDeck(d.id, d.cardCount)))
        .filter((vm): vm is NonNullable<typeof vm> => vm !== null),
);

const cursor = ref(new Date());
const weeks = computed(() =>
    statsApi.monthCalendar(cursor.value.getFullYear(), cursor.value.getMonth()),
);
const monthLabel = computed(() =>
    cursor.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
);
const prevMonth = () => {
    cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() - 1, 1);
};
const nextMonth = () => {
    cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + 1, 1);
};

onMounted(async () => {
    mimi.message.value = mimi.suggestion();
    await fetchList.execute({ cursor: null, append: false });
    await srs.fetchAll();
});
</script>
