<template>
    <section class="mx-auto flex max-w-6xl flex-col gap-6 p-8">
        <nav class="flex items-center gap-2 text-small text-brand-muted">
            <NuxtLink to="/discover" class="hover:text-cream">{{ t('discover.title') }}</NuxtLink>
            <span>/</span>
            <span class="capitalize text-cream">{{ subjectName }}</span>
        </nav>

        <header>
            <h1 class="font-display text-display-sm capitalize text-cream">
                {{ t('discover.topicTitle').replace('{subject}', subjectName) }}
            </h1>
            <p class="mt-1 max-w-[60ch] text-body text-cream-dim">
                {{ t('discover.topicSubtitle').replace('{subject}', subjectName) }}
            </p>
        </header>

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
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { createError, useHead, useRoute, useSiteConfig, useToast, useT } from '#imports';
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

const slug = computed(() => String(route.params.subject ?? ''));
const slugify = (s: string): string =>
    s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// Resolve the slug back to a real `subject` via the category list, then fetch its
// decks. Unknown subject (or categories endpoint unavailable) → no match → we
// re-throw at setup level for a real 404 (don't render an empty SEO page for a
// non-topic).
const { data, error } = await useAsyncData(
    () => `topic-${slug.value}`,
    async () => {
        const cats = await getPublicCategories();
        const match = cats.items.find((c) => slugify(c.subject) === slug.value);
        if (!match) {
            return null;
        }
        const res = await listPublicDecks({ subject: match.subject, sort: 'popular' }).catch(
            () => ({
                items: [] as DeckWithAuthor[],
                nextCursor: null,
                total: 0,
            }),
        );
        return { subject: match.subject, items: res.items };
    },
);
if (error.value || !data.value) {
    throw createError({ statusCode: 404, statusMessage: 'Topic not found' });
}

const subjectName = computed(() => data.value?.subject ?? slug.value.replace(/-/g, ' '));

const toVm = (d: DeckWithAuthor): DeckCardVM => ({
    ...deckToCardVm(d),
    author: d.author.username ?? d.author.fullName ?? 'someone',
    copies: d.copyCount,
});
const decks = computed<DeckCardVM[]>(() => (data.value?.items ?? []).map(toVm));

useSeo({
    title: t('seo.topicTitle').replace('{subject}', subjectName.value),
    description: t('seo.topicDesc').replace('{subject}', subjectName.value),
});

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
