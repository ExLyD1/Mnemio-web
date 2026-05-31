<template>
    <section class="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <header>
            <h1 class="font-display text-display-sm text-cream">
                {{ greeting }}{{ greetingName ? `, ${greetingName}` : '' }} 👋
            </h1>
            <p class="mt-2 text-body text-cream-dim">{{ t('dashboard.tagline') }}</p>
        </header>

        <DashboardContinueStudying
            v-if="incompleteSession"
            :session="incompleteSession"
            :deck-title="incompleteDeckTitle"
            @resume="onResume"
        />

        <div v-if="loading" class="flex justify-center py-12">
            <UiSpinner size="lg" />
        </div>

        <template v-else-if="decksStore.summaries.length">
            <div class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-2xl border border-line bg-bg-surface p-5">
                    <p class="text-small text-cream-faint">{{ t('dashboard.decks') }}</p>
                    <p class="mt-1 font-display text-h1 text-cream">{{ decksStore.total }}</p>
                </div>
                <div class="rounded-2xl border border-line bg-bg-surface p-5">
                    <p class="text-small text-cream-faint">{{ t('dashboard.cards') }}</p>
                    <p class="mt-1 font-display text-h1 text-cream">{{ totalCards }}</p>
                </div>
                <DashboardReviewCount :due-count="srs.dueCount" />
            </div>

            <div class="flex items-center justify-between">
                <h2 class="font-display text-h2 text-cream">{{ t('dashboard.recentDecks') }}</h2>
                <NuxtLink to="/decks" class="text-small text-lavender hover:underline">
                    {{ t('dashboard.viewAll') }}
                </NuxtLink>
            </div>
            <DeckGrid
                :decks="decksStore.summaries.slice(0, 6)"
                @edit="(id) => navigateTo(`/decks/${id}/edit`)"
                @delete="() => {}"
            />
        </template>

        <UiEmptyState
            v-else
            :icon="LayoutGrid"
            :title="t('deck.emptyTitle')"
            :message="t('deck.emptyMessage')"
        >
            <template #action>
                <UiButton variant="primary" @click="navigateTo('/decks/create')">
                    {{ t('deck.createFirst') }}
                </UiButton>
            </template>
        </UiEmptyState>
    </section>
</template>

<script setup lang="ts">
import { LayoutGrid } from 'lucide-vue-next';
import {
    useAuthStore,
    useDecks,
    useDecksStore,
    useSessionsStore,
    useSrsStore,
    useT,
} from '#imports';

definePageMeta({ layout: 'default' });

const auth = useAuthStore();
const { store: decksStore, fetchList } = useDecks();
const sessions = useSessionsStore();
const srs = useSrsStore();
const { t } = useT();

const loading = ref(false);

const greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 18) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
});
const greetingName = computed(() => auth.currentUser?.displayName ?? null);
const totalCards = computed(() =>
    decksStore.summaries.reduce((sum, d) => sum + d.cardCount, 0),
);

const incompleteSession = computed(() => sessions.latestIncomplete);
const incompleteDeckTitle = computed(() => {
    if (!incompleteSession.value) return null;
    return (
        decksStore.summaries.find((d) => d.id === incompleteSession.value!.deckId)?.title ?? null
    );
});

const onResume = async () => {
    if (!incompleteSession.value) return;
    const session = incompleteSession.value;
    await sessions.resume(session.id);
    const mode = session.mode === 'srs' ? 'srs' : session.mode;
    if (mode === 'srs') {
        await navigateTo('/review');
    } else {
        await navigateTo(`/study/${session.deckId}/${mode}`);
    }
};

onMounted(async () => {
    loading.value = true;
    await Promise.all([
        fetchList.execute({ cursor: null, append: false }),
        sessions.hydrate(),
        srs.fetchAll(),
    ]);
    loading.value = false;
});
</script>
