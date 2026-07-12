<template>
    <section class="mx-auto flex max-w-6xl flex-col gap-6 p-6 lg:p-8">
        <!-- Header: eyebrow + "All decks · N" (left) | filter chips (right) -->
        <header class="flex flex-wrap items-end justify-between gap-4">
            <div>
                <p class="text-eyebrow uppercase text-brand-muted">
                    {{ t('deck.libraryEyebrow') }}
                </p>
                <h1 class="mt-1 font-display text-[40px] leading-[1.05] text-cream">
                    {{ t('deck.allDecks') }}
                    <span class="font-sans text-[22px] font-normal text-cream-faint">
                        · {{ store.summaries.length }}
                    </span>
                </h1>
            </div>
            <SharedFilterChips
                v-if="store.summaries.length"
                v-model="filter"
                :options="filterOptions"
            />
        </header>

        <!-- Skeleton -->
        <div
            v-if="loading && !store.summaries.length"
            class="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4"
        >
            <div
                v-for="i in 8"
                :key="i"
                class="h-[240px] animate-pulse rounded-[20px] bg-bg-surface"
            />
        </div>

        <!-- Empty state -->
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

        <!-- 4-column deck grid -->
        <div v-else class="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
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
import { Plus, Library } from 'lucide-vue-next';
import { useDecks, usePreferencesStore, useT } from '#imports';
import { deckToCardVm } from '@/utils/deckVm';
import { DECK_CATEGORIES, normCategory } from '@/utils/deckCategories';

definePageMeta({ layout: 'default' });

const { store, fetchList } = useDecks();
const prefs = usePreferencesStore();
const { t } = useT();

useSeo({ title: t('seo.decksTitle'), description: t('seo.appDesc'), noindex: true });

const loading = ref(true);
const aiOpen = ref(false);
const filter = ref('all');

const favCount = computed(() => store.summaries.filter((d) => prefs.isFavorite(d.id)).length);

const filterOptions = computed(() => {
    const catCount = new Map<string, number>();
    for (const d of store.summaries) {
        const cat = normCategory(d.subject);
        catCount.set(cat, (catCount.get(cat) ?? 0) + 1);
    }
    const base = [{ key: 'all', label: t('deck.filterAll'), count: store.summaries.length }];
    if (favCount.value > 0) {
        base.push({ key: 'mine', label: t('deck.filterMine'), count: favCount.value });
    }
    const cats = DECK_CATEGORIES.filter((cat) => catCount.has(cat)).map((cat) => ({
        key: `cat:${cat}`,
        label: t(`deck.category.${cat}`),
        count: catCount.get(cat) ?? 0,
    }));
    return [...base, ...cats];
});

const deckVms = computed(() => {
    const list = store.summaries.filter((d) => {
        if (filter.value === 'all') return true;
        if (filter.value === 'mine') return prefs.isFavorite(d.id);
        if (filter.value.startsWith('cat:')) {
            return normCategory(d.subject) === filter.value.slice('cat:'.length);
        }
        return true;
    });
    return list
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .map((d) => deckToCardVm(d, prefs.isFavorite(d.id)));
});

onMounted(async () => {
    loading.value = true;
    prefs.hydrate().catch(() => {});
    await fetchList.execute({ cursor: null, append: false });
    loading.value = false;
});
</script>
