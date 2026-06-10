<template>
    <section class="mx-auto flex max-w-6xl flex-col gap-6 p-8">
        <header class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 class="font-display text-display-sm text-cream">{{ t('deck.myDecks') }}</h1>
                <p class="mt-1 text-body text-cream-dim">
                    {{
                        t('deck.listSummary')
                            .replace('{decks}', String(store.summaries.length))
                            .replace('{cards}', String(totalCards))
                            .replace('{due}', String(totalDue))
                    }}
                </p>
            </div>
            <div class="flex gap-2">
                <UiButton variant="ghost" @click="aiOpen = true">
                    <Sparkles class="size-4" />
                    {{ t('ai.launchNew') }}
                </UiButton>
                <UiButton variant="primary" @click="navigateTo('/decks/create')">
                    <Plus class="size-4" />
                    {{ t('topbar.newDeck') }}
                </UiButton>
            </div>
        </header>

        <div
            v-if="store.summaries.length"
            class="flex flex-wrap items-center justify-between gap-3"
        >
            <SharedFilterChips v-model="filter" :options="filterOptions" />
            <SharedSortMenu v-model="sort" :options="sortOptions" />
        </div>

        <SharedPageLoader v-if="loading && !store.summaries.length" />

        <UiEmptyState
            v-else-if="!store.summaries.length"
            :icon="Library"
            :title="t('deck.emptyTitle')"
            :message="t('deck.emptyMessage')"
        >
            <template #action>
                <UiButton variant="primary" @click="navigateTo('/decks/create')">
                    {{ t('deck.createFirst') }}
                </UiButton>
            </template>
        </UiEmptyState>

        <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SharedDeckCard
                v-for="vm in deckVms"
                :key="vm.id"
                :deck="vm"
                favoritable
                @toggle-fav="prefs.toggleFavorite"
                @practice="(id) => navigateTo(`/study/${id}`)"
                @add-cards="(id) => navigateTo(`/decks/${id}/cards/add`)"
            />
            <NuxtLink
                to="/decks/create"
                class="grid min-h-[220px] place-items-center rounded-[20px] border border-dashed border-line-strong text-brand-muted transition-colors hover:border-brand-bright hover:text-cream"
            >
                <span class="flex flex-col items-center gap-2">
                    <Plus class="size-6" />
                    {{ t('topbar.newDeck') }}
                </span>
            </NuxtLink>
        </div>

        <AiImportDialog v-model="aiOpen" />
    </section>
</template>

<script setup lang="ts">
import { Plus, Library, Sparkles } from 'lucide-vue-next';
import { useDecks, usePreferencesStore, useT } from '#imports';
import { deckToCardVm } from '@/utils/deckVm';
import { LANGUAGES } from '@/schemas/deck';

definePageMeta({ layout: 'default' });

const { store, fetchList } = useDecks();
const prefs = usePreferencesStore();
const { t } = useT();

useSeo({ title: t('seo.decksTitle'), description: t('seo.appDesc'), noindex: true });

const loading = ref(true);
const aiOpen = ref(false);
const filter = ref('all');
const sort = ref('recent');

const sortOptions = computed(() => [
    { key: 'recent', label: t('deck.sortRecent') },
    { key: 'name', label: t('deck.sortName') },
    { key: 'due', label: t('deck.sortDue') },
    { key: 'mastery', label: t('deck.sortMastery') },
]);

const totalCards = computed(() => store.summaries.reduce((sum, d) => sum + d.cardCount, 0));
const totalDue = computed(() => store.summaries.reduce((sum, d) => sum + d.stats.due, 0));

const favCount = computed(() => store.summaries.filter((d) => prefs.isFavorite(d.id)).length);

const filterOptions = computed(() => {
    const counts = new Map<string, number>();
    for (const d of store.summaries) {
        counts.set(d.targetLanguage, (counts.get(d.targetLanguage) ?? 0) + 1);
    }
    const langs = [...counts.entries()].map(([code, count]) => ({
        key: code,
        label: LANGUAGES.find((l) => l.code === code)?.label ?? code.toUpperCase(),
        count,
    }));
    const base = [{ key: 'all', label: t('deck.filterAll'), count: store.summaries.length }];
    if (favCount.value > 0) {
        base.push({ key: 'favorites', label: t('deck.filterFavorites'), count: favCount.value });
    }
    return [...base, ...langs];
});

const deckVms = computed(() => {
    const list = store.summaries.filter((d) => {
        if (filter.value === 'all') {
            return true;
        }
        if (filter.value === 'favorites') {
            return prefs.isFavorite(d.id);
        }
        return d.targetLanguage === filter.value;
    });
    const rows = list.map((d) => ({
        vm: deckToCardVm(d, prefs.isFavorite(d.id)),
        updatedAt: d.updatedAt,
    }));
    rows.sort((a, b) => {
        if (sort.value === 'name') return a.vm.title.localeCompare(b.vm.title);
        if (sort.value === 'due') return b.vm.due - a.vm.due;
        if (sort.value === 'mastery') return b.vm.masteredPct - a.vm.masteredPct;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return rows.map((r) => r.vm);
});

onMounted(async () => {
    loading.value = true;
    prefs.hydrate().catch(() => {});
    await fetchList.execute({ cursor: null, append: false });
    loading.value = false;
});
</script>
