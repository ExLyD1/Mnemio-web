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

        <!-- Floating Mimi import button -->
        <button
            type="button"
            class="fixed bottom-[26px] right-[28px] z-30 hidden size-[58px] cursor-pointer place-items-center rounded-full border border-[rgba(242,188,255,.35)] p-0 md:grid"
            style="
                background: linear-gradient(150deg, #572f54, #2c1a2a);
                box-shadow: 0 10px 28px -6px rgba(169, 142, 227, 0.3);
            "
            :aria-label="t('ai.titleNew')"
            @click="aiOpen = true"
        >
            <SharedMimi :size="40" :bob="false" class="pointer-events-none" />
        </button>

        <AiImportDialog v-model="aiOpen" />
    </section>
</template>

<script setup lang="ts">
import { Plus, Library } from 'lucide-vue-next';
import { useDecks, usePreferencesStore, useT } from '#imports';
import { deckToCardVm } from '@/utils/deckVm';

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
    const counts = new Map<string, number>();
    for (const d of store.summaries) {
        if (d.subject) {
            counts.set(d.subject, (counts.get(d.subject) ?? 0) + 1);
        }
    }
    const subjects = [...counts.entries()].map(([subject, count]) => ({
        key: `subject:${subject}`,
        label: subject,
        count,
    }));
    const base = [{ key: 'all', label: t('deck.filterAll'), count: store.summaries.length }];
    if (favCount.value > 0) {
        base.push({ key: 'mine', label: t('deck.filterMine'), count: favCount.value });
    }
    return [...base, ...subjects];
});

const deckVms = computed(() => {
    const list = store.summaries.filter((d) => {
        if (filter.value === 'all') return true;
        if (filter.value === 'mine') return prefs.isFavorite(d.id);
        if (filter.value.startsWith('subject:')) {
            return d.subject === filter.value.slice('subject:'.length);
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
