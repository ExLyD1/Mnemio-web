<template>
    <section class="mx-auto flex max-w-6xl flex-col gap-6 p-8">
        <nav class="flex items-center gap-2 text-small text-brand-muted">
            <NuxtLink to="/discover" class="hover:text-cream">{{ t('discover.title') }}</NuxtLink>
            <span>/</span>
            <span class="text-cream">{{ subjectName }}</span>
        </nav>

        <header>
            <h1 class="font-display text-display-sm text-cream">
                {{ t('discover.topicTitle').replace('{subject}', subjectName) }}
            </h1>
            <p class="mt-1 max-w-[60ch] text-body text-cream-dim">
                {{ t('discover.topicSubtitle').replace('{subject}', subjectName) }}
            </p>
        </header>

        <SharedFilterChips
            v-if="slug === 'languages' && languageChips.length > 1"
            v-model="lang"
            :options="languageChips"
        />

        <div v-if="decks.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SharedDeckCard
                v-for="vm in decks"
                :key="vm.id"
                :deck="vm"
                variant="discover"
                :to="`/discover/sets/${vm.id}`"
                @preview="navigateTo(`/discover/sets/${vm.id}`)"
                @copy="onCopy(vm.id)"
            />
        </div>
        <p v-else class="text-body text-brand-muted">{{ t('discover.noResults') }}</p>

        <div v-if="more.cursor.value" class="flex justify-center">
            <UiButton variant="ghost" :disabled="more.loading.value" @click="onLoadMore">
                <UiSpinner v-if="more.loading.value" size="sm" class="mr-2" />
                {{ t('common.loadMore') }}
            </UiButton>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { createError, useHead, useRoute, useSiteConfig, useToast, useT } from '#imports';
import { listPublicDecks, getPublicCategories } from '@/api/publicDiscover';
import { copyDeck } from '@/api/discover';
import { useAuthStore } from '@/stores/auth';
import { useAnalytics } from '@/composables/useAnalytics';
import { useDiscoverMore, discoverToVm } from '@/composables/useDiscoverMore';
import { useTaxonomy } from '@/composables/useTaxonomy';
import type { DeckCardVM } from '@/types/deck';
import { isSubject, langLabel, subjectLabel } from '@/utils/subjects';

definePageMeta({ layout: 'default' });

const { t } = useT();
const route = useRoute();
const toast = useToast();
const auth = useAuthStore();
const analytics = useAnalytics();
const site = useSiteConfig();

const rawSlug = computed(() => String(route.params.subject ?? ''));
const slug = computed(() => rawSlug.value.toLowerCase());

// Only the 12 subjects are topics. A pre-002 slug (/discover/biology), or a
// subject in odd casing, is a permanent move: a real 301 during SSR so
// crawlers update. Anything else is a 404.
const taxonomy = useTaxonomy();
await useAsyncData('taxonomy', () => taxonomy.ensure());
const movedTo = (): string | null => {
    if (isSubject(slug.value)) {
        return slug.value === rawSlug.value ? null : slug.value;
    }
    return taxonomy.legacySubjects.value[slug.value] ?? null;
};
const moved = movedTo();
if (moved) {
    await navigateTo(`/discover/${moved}`, { redirectCode: 301 });
} else if (!isSubject(slug.value) || !taxonomy.subjects.value.includes(slug.value)) {
    throw createError({ statusCode: 404, statusMessage: 'Topic not found' });
}

// Language decks filter by their target language (Languages only).
const lang = ref(typeof route.query.lang === 'string' ? route.query.lang : 'all');
const deckQuery = () => ({
    subject: isSubject(slug.value) ? slug.value : undefined,
    lang: slug.value === 'languages' && lang.value !== 'all' ? lang.value : undefined,
    sort: 'popular' as const,
});

const { data } = await useAsyncData(
    () => `topic-${slug.value}`,
    async () => {
        const [res, cats] = await Promise.all([
            listPublicDecks(deckQuery()).catch(() => ({
                items: [],
                nextCursor: null as string | null,
                total: 0,
            })),
            slug.value === 'languages'
                ? getPublicCategories().catch(() => null)
                : Promise.resolve(null),
        ]);
        return { items: res.items, nextCursor: res.nextCursor, languages: cats?.languages ?? [] };
    },
    { watch: [lang] },
);

const subjectName = computed(() => subjectLabel(t, slug.value));
const languageChips = computed(() => [
    { key: 'all', label: t('discover.filterAll') },
    ...(data.value?.languages ?? []).map((l) => ({
        key: l.lang,
        label: langLabel(t, l.lang),
        count: l.count,
    })),
]);

const more = useDiscoverMore();
watch(data, (d) => more.init(d?.nextCursor ?? null), { immediate: true });

const decks = computed<DeckCardVM[]>(() => [
    ...(data.value?.items ?? []).map(discoverToVm),
    ...more.extra.value,
]);

const onLoadMore = () =>
    more.loadMore(() => listPublicDecks({ ...deckQuery(), cursor: more.cursor.value! }));

useSeo({
    title: t('seo.topicTitle').replace('{subject}', subjectName.value),
    description: t('seo.topicDesc').replace('{subject}', subjectName.value),
});

const onCopy = async (deckId: string) => {
    if (!auth.isAuthenticated) {
        analytics.track('deck_copied_from_discover', {
            deck_id: deckId,
            viewer_authenticated: false,
            entry_point: 'discover_subject',
        });
        analytics.registerSuper({ registration_intent: 'discover_copy', intent_deck_id: deckId });
        await navigateTo('/login?tab=register&from=discover_copy');
        return;
    }
    try {
        const copy = await copyDeck(deckId);
        analytics.track('deck_copied_from_discover', {
            deck_id: deckId,
            viewer_authenticated: true,
            entry_point: 'discover_subject',
        });
        toast.success(t('discover.copied'));
        await navigateTo(`/decks/${copy.id}`);
    } catch {
        toast.error(t('discover.copyError'));
    }
};

const base = (site.url || 'https://mnemio.xyz').replace(/\/$/, '');
useHead({
    script: [
        {
            type: 'application/ld+json',
            innerHTML: computed(() =>
                JSON.stringify({
                    '@context': 'https://schema.org',
                    '@graph': [
                        {
                            '@type': 'BreadcrumbList',
                            itemListElement: [
                                {
                                    '@type': 'ListItem',
                                    position: 1,
                                    name: t('discover.title'),
                                    item: `${base}/discover`,
                                },
                                {
                                    '@type': 'ListItem',
                                    position: 2,
                                    name: subjectName.value,
                                    item: `${base}/discover/${slug.value}`,
                                },
                            ],
                        },
                        {
                            '@type': 'CollectionPage',
                            name: subjectName.value,
                            url: `${base}/discover/${slug.value}`,
                            mainEntity: {
                                '@type': 'ItemList',
                                itemListElement: decks.value.map((d, i) => ({
                                    '@type': 'ListItem',
                                    position: i + 1,
                                    url: `${base}/discover/sets/${d.id}`,
                                    name: d.title,
                                })),
                            },
                        },
                    ],
                }),
            ),
        },
    ],
});
</script>
