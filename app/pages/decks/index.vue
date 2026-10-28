<template>
    <section class="mx-auto flex max-w-6xl flex-col gap-5 p-6 lg:p-8">
        <!-- Header: "Library · N" (left) | import actions (right) -->
        <header class="flex flex-wrap items-end justify-between gap-4">
            <h1 class="font-display text-[40px] leading-[1.05] text-cream">
                {{ t('library.title') }}
                <span
                    v-if="ready"
                    class="font-sans text-[22px] font-normal tabular-nums text-cream-faint"
                >
                    · {{ store.total }}
                </span>
            </h1>
            <div class="flex flex-wrap gap-3">
                <UiButton variant="ghost" @click="aiOpen = true">{{ t('anki.aiImport') }}</UiButton>
                <UiButton variant="ghost" @click="ankiOpen = true">{{ t('anki.title') }}</UiButton>
            </div>
        </header>

        <!-- Tabs + subject chips (+ language chips under Languages) -->
        <div v-if="store.facets" class="flex min-w-0 flex-col gap-3">
            <SharedFilterChips
                :model-value="filters.scope"
                :options="scopeChips"
                :label="t('library.tabsLabel')"
                scroll
                @update:model-value="(v) => setFilters({ scope: v as LibraryScope })"
            />
            <SharedFilterChips
                v-if="subjectChips.length > 1"
                :model-value="filters.subject ?? 'all'"
                :options="subjectChips"
                :label="t('library.subjectsLabel')"
                scroll
                @update:model-value="
                    (v) => setFilters({ subject: v === 'all' ? null : (v as Subject), lang: null })
                "
            />
            <SharedFilterChips
                v-if="filters.subject === 'languages' && languageChips.length > 1"
                :model-value="filters.lang ?? 'all'"
                :options="languageChips"
                :label="t('library.languagesLabel')"
                scroll
                @update:model-value="(v) => setFilters({ lang: v === 'all' ? null : v })"
            />
        </div>

        <!-- Inline fetch error: previously loaded decks stay on screen -->
        <div
            v-if="errorText"
            role="alert"
            class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error-soft/40 bg-error-soft/5 px-4 py-3"
        >
            <p class="text-small text-error-soft">{{ t('library.loadError') }} {{ errorText }}</p>
            <UiButton variant="ghost" :disabled="fetch.loading.value" @click="load">
                {{ t('practice.retry') }}
            </UiButton>
        </div>

        <!-- Skeleton -->
        <div
            v-if="!ready && !errorText"
            class="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4"
            aria-busy="true"
        >
            <div
                v-for="i in 8"
                :key="i"
                class="h-[240px] animate-pulse rounded-[20px] bg-bg-surface"
            />
        </div>

        <template v-else-if="ready && !store.items.length && !errorText">
            <!-- No decks at all -->
            <UiEmptyState
                v-if="emptyKind === 'none'"
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
            <!-- Learning is empty -->
            <UiEmptyState
                v-else-if="emptyKind === 'learning'"
                :icon="Library"
                :title="t('library.emptyLearningTitle')"
                :message="t('library.emptyLearningMsg')"
            >
                <template #action>
                    <UiButton variant="primary" @click="navigateTo('/discover')">
                        {{ t('library.browseDiscover') }}
                    </UiButton>
                </template>
            </UiEmptyState>
            <!-- A filter with no results -->
            <UiEmptyState
                v-else
                :title="t('library.emptyFiltered')"
                :message="t('library.emptyFilteredMsg')"
            >
                <template #action>
                    <UiButton @click="setFilters({ subject: null, lang: null })">
                        {{ t('library.clearFilters') }}
                    </UiButton>
                </template>
            </UiEmptyState>
        </template>

        <!-- 4-column deck grid -->
        <div
            v-else-if="store.items.length"
            class="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4"
            :aria-busy="fetch.loading.value"
        >
            <SharedDeckCard
                v-for="vm in deckVms"
                :key="vm.id"
                :deck="vm"
                favoritable
                @toggle-fav="prefs.toggleFavorite"
            />
            <NuxtLink
                v-if="filters.scope !== 'learning' && !filters.subject"
                to="/decks/create"
                class="grid min-h-[220px] place-items-center rounded-[20px] border border-dashed border-line-strong text-brand-muted transition-colors hover:border-brand-bright hover:text-cream"
            >
                <span class="flex flex-col items-center gap-2">
                    <Plus class="size-6" />
                    {{ t('topbar.newDeck') }}
                </span>
            </NuxtLink>
        </div>

        <!-- Load more -->
        <div v-if="store.nextCursor && store.items.length" class="flex justify-center">
            <UiButton variant="ghost" :disabled="more.loading.value" @click="onLoadMore">
                <UiSpinner v-if="more.loading.value" size="sm" class="mr-2" />
                {{ t('common.loadMore') }}
            </UiButton>
        </div>

        <AiImportDialog v-model="aiOpen" />
        <DeckAnkiImportDialog v-model="ankiOpen" />
    </section>
</template>

<script setup lang="ts">
import { Plus, Library } from 'lucide-vue-next';
import { usePreferencesStore, useT } from '#imports';
import { useLibrary } from '@/composables/useLibrary';
import { useAnalytics } from '@/composables/useAnalytics';
import { LIBRARY_SCOPES, type LibraryScope } from '@/api/library';
import type { LibraryFilters } from '@/stores/library';
import { deckToCardVm } from '@/utils/deckVm';
import { isSubject, langLabel, subjectLabel, type Subject } from '@/utils/subjects';

definePageMeta({ layout: 'default' });

const { store, fetch, loadMore: more } = useLibrary();
const prefs = usePreferencesStore();
const { t } = useT();
const { apiErrorText } = useApiError();
const analytics = useAnalytics();
const route = useRoute();
const router = useRouter();

useSeo({ title: t('seo.decksTitle'), description: t('seo.appDesc'), noindex: true });

const aiOpen = ref(false);
const ankiOpen = ref(false);
const ready = ref(false);

// Filter state lives in the URL (?scope=&subject=&lang=) so back/refresh keep it.
const filters = computed<LibraryFilters>(() => {
    const q = route.query;
    const scope = LIBRARY_SCOPES.find((s) => s === q.scope) ?? 'all';
    const subject = isSubject(q.subject) ? q.subject : null;
    const lang = subject === 'languages' && typeof q.lang === 'string' && q.lang ? q.lang : null;
    return { scope, subject, lang };
});

const setFilters = (patch: Partial<LibraryFilters>) => {
    const next = { ...filters.value, ...patch };
    if (next.subject !== 'languages') {
        next.lang = null;
    }
    analytics.track('library_filter_changed', {
        scope: next.scope,
        subject: next.subject,
        lang: next.lang,
    });
    return router.replace({
        query: {
            ...(next.scope !== 'all' ? { scope: next.scope } : {}),
            ...(next.subject ? { subject: next.subject } : {}),
            ...(next.lang ? { lang: next.lang } : {}),
        },
    });
};

const load = async () => {
    await fetch.execute(filters.value);
    if (!fetch.error.value) {
        ready.value = true;
    }
};
const onLoadMore = () => more.execute();

const errorText = computed(() => {
    const err = fetch.error.value ?? more.error.value;
    return err ? apiErrorText(err) : '';
});

const scopeChips = computed(() => {
    const counts = store.facets?.scopes;
    return [
        { key: 'all', label: t('library.tabAll'), count: counts?.all },
        { key: 'my', label: t('library.tabMy'), count: counts?.my },
        { key: 'learning', label: t('library.tabLearning'), count: counts?.learning },
    ];
});
const subjectChips = computed(() => [
    { key: 'all', label: t('deck.filterAll') },
    ...(store.facets?.subjects ?? [])
        .filter((s) => s.count > 0)
        .map((s) => ({ key: s.subject, label: subjectLabel(t, s.subject), count: s.count })),
]);
const languageChips = computed(() => [
    { key: 'all', label: t('deck.filterAll') },
    ...(store.facets?.languages ?? [])
        .filter((l) => l.count > 0)
        .map((l) => ({ key: l.lang, label: langLabel(t, l.lang), count: l.count })),
]);

// Which empty state an empty list shows (L8).
const emptyKind = computed<'none' | 'learning' | 'filtered'>(() => {
    if (filters.value.subject) {
        return 'filtered';
    }
    if (filters.value.scope === 'learning') {
        return 'learning';
    }
    return 'none';
});

const deckVms = computed(() => store.items.map((d) => deckToCardVm(d, prefs.isFavorite(d.id))));

watch(() => JSON.stringify(filters.value), load);
// An Anki import adds decks while the page stays open.
watch(ankiOpen, (open) => {
    if (!open) {
        void load();
    }
});

onMounted(() => {
    prefs.hydrate().catch(() => {});
    void load();
});
</script>
