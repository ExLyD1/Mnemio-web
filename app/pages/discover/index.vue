<template>
    <section class="mx-auto flex max-w-6xl flex-col gap-6 p-8">
        <header>
            <h1 class="font-display text-display-sm text-cream">{{ t('discover.title') }}</h1>
            <p class="mt-1 text-body text-cream-dim">
                {{ t('discover.subtitle') }}
            </p>
        </header>

        <UiInputSearch
            v-model="search"
            :placeholder="t('discover.searchPlaceholder')"
            variant="dark"
        />

        <div class="flex flex-wrap items-center justify-between gap-3">
            <SharedFilterChips v-model="filter" :options="filters" />
            <SharedSortMenu v-model="sort" :options="sorts" />
        </div>

        <div v-if="decks.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SharedDeckCard
                v-for="vm in decks"
                :key="vm.id"
                :deck="vm"
                variant="discover"
                :to="`/discover/sets/${vm.id}`"
                @preview="onPreview(vm.id)"
                @copy="onCopy(vm.id)"
            />
        </div>
        <p v-else-if="!pending" class="text-body text-brand-muted">
            {{ t('discover.noResults') }}
        </p>

        <div v-if="categories.length && !search.trim()">
            <h2 class="mb-3 font-display text-h2 text-cream">{{ t('discover.categories') }}</h2>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <NuxtLink
                    v-for="cat in categories"
                    :key="cat.subject"
                    :to="`/discover/${slugify(cat.subject)}`"
                    class="flex items-center justify-between rounded-2xl border border-line border-l-2 border-l-brand-bright bg-bg-surface px-5 py-4 text-left transition-all hover:shadow-md hover:shadow-brand/10"
                >
                    <span>
                        <span class="block font-display text-h3 capitalize text-cream">
                            {{ cat.subject }}
                        </span>
                        <span class="text-small text-brand-muted">{{
                            t('discover.categoryCount').replace('{n}', String(cat.count))
                        }}</span>
                    </span>
                    <ArrowRight class="size-4 text-brand-muted" />
                </NuxtLink>
            </div>
        </div>

        <div
            v-if="!search.trim()"
            class="flex flex-col items-center gap-5 rounded-[20px] border border-line bg-mimi-ambient p-6 text-center sm:flex-row sm:text-left"
        >
            <SharedMimi :size="96" placement="left" />
            <div class="flex-1">
                <p class="font-display text-h2 text-cream">{{ t('discover.ctaTitle') }}</p>
                <p class="mt-1 text-body text-cream-dim">{{ t('discover.ctaSubtitle') }}</p>
            </div>
            <UiButton variant="primary" @click="navigateTo('/login?tab=register')">{{
                t('discover.ctaButton')
            }}</UiButton>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useHead, useRoute, useSiteConfig, useToast, useT } from '#imports';
import { useDebounceFn } from '@vueuse/core';
import { listPublicDecks, getPublicCategories } from '@/api/publicDiscover';
import { copyDeck } from '@/api/discover';
import { deckToCardVm } from '@/utils/deckVm';
import { useAuthStore } from '@/stores/auth';
import type { DeckCardVM, DeckWithAuthor } from '@/types/deck';

definePageMeta({ layout: 'default' });

const { t } = useT();
const route = useRoute();
const toast = useToast();
const auth = useAuthStore();
const site = useSiteConfig();

useSeo({ title: t('seo.discoverTitle'), description: t('seo.discoverDesc') });

const slugify = (s: string): string =>
    s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const toVm = (d: DeckWithAuthor): DeckCardVM => ({
    ...deckToCardVm(d),
    author: d.author.username ?? d.author.fullName ?? 'someone',
    copies: d.copyCount,
});

const search = ref(typeof route.query.q === 'string' ? route.query.q : '');
const filter = ref('all');
const sort = ref<'recent' | 'popular'>('recent');

const filters = [
    { key: 'all', label: t('discover.filterAll') },
    { key: 'ja', label: 'Japanese' },
    { key: 'es', label: 'Spanish' },
    { key: 'en', label: 'English' },
    { key: 'fr', label: 'French' },
    { key: 'de', label: 'German' },
    { key: 'ko', label: 'Korean' },
    { key: 'zh', label: 'Mandarin' },
];
const sorts = [
    { key: 'recent', label: t('discover.sortNewest') },
    { key: 'popular', label: t('discover.sortPopular') },
];

// SSR fetch so the catalog ships in the initial HTML (crawler-visible). Public,
// no-auth endpoints — works for logged-out crawlers and signed-in users alike.
const { data, pending } = await useAsyncData(
    'discover-catalog',
    () =>
        Promise.all([
            listPublicDecks({
                q: search.value.trim() || undefined,
                lang: filter.value === 'all' ? undefined : filter.value,
                sort: sort.value,
            }).catch(() => ({ items: [] as DeckWithAuthor[], nextCursor: null, total: 0 })),
            getPublicCategories().catch(() => ({ items: [] })),
        ]),
    { watch: [filter, sort] },
);

const decks = computed<DeckCardVM[]>(() => (data.value?.[0].items ?? []).map(toVm));
const categories = computed(() => data.value?.[1].items ?? []);

// Debounced refetch as the user types (re-runs the same useAsyncData handler).
const debouncedRefresh = useDebounceFn(() => refreshNuxtData('discover-catalog'), 150);
watch(search, debouncedRefresh);

const onCopy = async (deckId: string) => {
    if (!auth.isAuthenticated) {
        await navigateTo('/login?tab=register');
        return;
    }
    try {
        const copy = await copyDeck(deckId);
        toast.success(t('discover.copied'));
        await navigateTo(`/decks/${copy.id}`);
    } catch {
        toast.error(t('discover.copyError'));
    }
};

const onPreview = (deckId: string) => navigateTo(`/discover/sets/${deckId}`);

// ItemList structured data of the visible decks (helps Google build a rich listing).
const base = (site.url || 'https://mnemio.xyz').replace(/\/$/, '');
useHead({
    script: [
        {
            type: 'application/ld+json',
            innerHTML: computed(() =>
                JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'ItemList',
                    name: t('discover.title'),
                    itemListElement: decks.value.map((d, i) => ({
                        '@type': 'ListItem',
                        position: i + 1,
                        url: `${base}/discover/sets/${d.id}`,
                        name: d.title,
                    })),
                }),
            ),
        },
    ],
});
</script>
