<template>
    <section class="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        <header>
            <h1 class="text-h1 font-bold text-neutral-0">
                {{ greeting }}{{ greetingName ? `, ${greetingName}` : '' }} 👋
            </h1>
            <p class="mt-2 text-body text-brand-muted">{{ tagline }}</p>
        </header>

        <div v-if="store.loadingList && !store.summaries.length" class="flex justify-center py-12">
            <UiSpinner size="lg" />
        </div>

        <template v-else-if="store.summaries.length">
            <div class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-2xl bg-bg-surface p-5">
                    <p class="text-small text-brand-muted">{{ t('dashboard.decks') }}</p>
                    <p class="mt-1 text-h2 font-bold text-neutral-0">{{ store.total }}</p>
                </div>
                <div class="rounded-2xl bg-bg-surface p-5">
                    <p class="text-small text-brand-muted">{{ t('dashboard.cards') }}</p>
                    <p class="mt-1 text-h2 font-bold text-neutral-0">{{ totalCards }}</p>
                </div>
                <div class="rounded-2xl bg-bg-surface p-5">
                    <p class="text-small text-brand-muted">{{ t('dashboard.recent') }}</p>
                    <p class="mt-1 text-h2 font-bold text-neutral-0">{{ recentTitle }}</p>
                </div>
            </div>

            <div class="flex items-center justify-between">
                <h2 class="text-h2 font-bold text-neutral-0">{{ t('dashboard.recentDecks') }}</h2>
                <NuxtLink to="/decks" class="text-small text-accent hover:underline">
                    {{ t('dashboard.viewAll') }}
                </NuxtLink>
            </div>
            <DeckGrid
                :decks="store.summaries.slice(0, 6)"
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
                <UiButton variant="light" @click="navigateTo('/decks/create')">
                    {{ t('deck.createFirst') }}
                </UiButton>
            </template>
        </UiEmptyState>
    </section>
</template>

<script setup lang="ts">
import { LayoutGrid } from 'lucide-vue-next';
import { useAuthStore, useDecks, useT } from '#imports';

definePageMeta({ layout: 'default' });

const auth = useAuthStore();
const { store, fetchList } = useDecks();
const { t } = useT();

const greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 18) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
});
const greetingName = computed(() => auth.currentUser?.displayName ?? null);
const tagline = computed(() => t('dashboard.tagline'));

const totalCards = computed(() =>
    store.summaries.reduce((sum, d) => sum + d.cardCount, 0),
);
const recentTitle = computed(() => store.summaries[0]?.title ?? '—');

onMounted(() => {
    fetchList.execute({ cursor: null, append: false });
});
</script>
