<template>
    <section v-if="deck" class="mx-auto flex max-w-4xl flex-col gap-6 p-8">
        <nav class="flex flex-wrap items-center gap-2 text-small text-brand-muted">
            <NuxtLink to="/discover" class="hover:text-cream">{{ t('discover.title') }}</NuxtLink>
            <template v-if="deck.subject">
                <span>/</span>
                <NuxtLink
                    :to="`/discover/${slugify(deck.subject)}`"
                    class="capitalize hover:text-cream"
                >
                    {{ deck.subject }}
                </NuxtLink>
            </template>
            <span>/</span>
            <span class="line-clamp-1 text-cream">{{ deck.title }}</span>
        </nav>

        <header class="flex flex-col gap-3">
            <h1 class="font-display text-display-sm text-cream">{{ deck.title }}</h1>
            <p v-if="deck.description" class="max-w-[65ch] text-body text-cream-dim">
                {{ deck.description }}
            </p>
            <div class="flex flex-wrap items-center gap-3 text-small text-brand-muted">
                <span>{{ t('deck.cardCount').replace('{n}', String(cardCount)) }}</span>
                <template v-if="copyCount > 0">
                    <span class="text-brand-muted/60">·</span>
                    <span>{{ t('discover.copies').replace('{n}', String(copyCount)) }}</span>
                </template>
                <template v-if="authorName">
                    <span class="text-brand-muted/60">·</span>
                    <span>{{ t('discover.byAuthor').replace('{name}', authorName) }}</span>
                </template>
            </div>
            <div class="mt-2 flex flex-wrap gap-3">
                <UiButton variant="primary" @click="onCopy">{{ t('discover.copy') }}</UiButton>
                <NuxtLink :to="`/decks/${deck.id}`">
                    <UiButton variant="ghost">{{ t('discover.openDeck') }}</UiButton>
                </NuxtLink>
            </div>
        </header>

        <ul class="flex flex-col gap-3">
            <li
                v-for="card in visibleCards"
                :key="card.id"
                class="flex flex-col gap-1 rounded-2xl border border-line bg-bg-surface p-5"
            >
                <p class="font-display text-h3 text-cream">{{ card.word }}</p>
                <p class="text-body text-cream-dim">{{ card.definition }}</p>
                <p v-if="card.example" class="text-small italic text-brand-muted">
                    {{ card.example }}
                </p>
            </li>
        </ul>

        <div v-if="deck.cards.length > visibleCardCount" class="flex justify-center">
            <UiButton variant="ghost" @click="visibleCardCount += CARD_PAGE">
                {{ t('common.loadMore') }}
                ({{ deck.cards.length - visibleCardCount }} {{ t('deck.statTotal').toLowerCase() }})
            </UiButton>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { createError, useHead, useRoute, useSiteConfig, useToast, useT } from '#imports';
import { getPublicDeck } from '@/api/publicDiscover';
import { copyDeck } from '@/api/discover';
import { useAuthStore } from '@/stores/auth';
import { useAnalytics } from '@/composables/useAnalytics';

definePageMeta({ layout: 'default' });

const { t } = useT();
const route = useRoute();
const toast = useToast();
const auth = useAuthStore();
const analytics = useAnalytics();
const site = useSiteConfig();

const id = computed(() => String(route.params.id ?? ''));

const slugify = (s: string): string =>
    s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// SSR the deck + its cards so the page has real, indexable content. A non-public
// or missing id (or the backend public endpoint being unavailable) surfaces as an
// error; we re-throw it at setup level so SSR returns a real 404 (no leak, no
// empty indexable page).
const { data: deck, error } = await useAsyncData(
    () => `public-deck-${id.value}`,
    () => getPublicDeck(id.value),
);
if (error.value || !deck.value) {
    throw createError({ statusCode: 404, statusMessage: 'Deck not found' });
}

// The public-deck endpoint returns the cards inline but may omit the summary
// counts/author, so derive them defensively (card count from the embedded cards;
// author chip hidden when absent) instead of rendering `undefined`.
const CARD_PAGE = 30;
const visibleCardCount = ref(CARD_PAGE);
const visibleCards = computed(() => deck.value?.cards.slice(0, visibleCardCount.value) ?? []);

const cardCount = computed(() => deck.value?.cardCount ?? deck.value?.cards.length ?? 0);
const copyCount = computed(() => deck.value?.copyCount ?? 0);
const authorName = computed(
    () => deck.value?.author?.username ?? deck.value?.author?.fullName ?? '',
);

useSeo({
    title: t('seo.deckTitle').replace('{title}', deck.value?.title ?? ''),
    description: deck.value?.description
        ? deck.value.description
        : t('seo.deckDesc').replace('{title}', deck.value?.title ?? ''),
});

const onCopy = async () => {
    if (!auth.isAuthenticated) {
        analytics.track('deck_copied_from_discover', {
            deck_id: id.value,
            viewer_authenticated: false,
            entry_point: 'discover_set_detail',
        });
        analytics.registerSuper({
            registration_intent: 'discover_copy',
            intent_deck_id: id.value,
        });
        await navigateTo('/login?tab=register&from=discover_copy');
        return;
    }
    try {
        const copy = await copyDeck(id.value);
        analytics.track('deck_copied_from_discover', {
            deck_id: id.value,
            viewer_authenticated: true,
            entry_point: 'discover_set_detail',
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
            innerHTML: computed(() => {
                const d = deck.value;
                if (!d) {
                    return '{}';
                }
                const breadcrumb = [
                    {
                        '@type': 'ListItem',
                        position: 1,
                        name: t('discover.title'),
                        item: `${base}/discover`,
                    },
                ];
                if (d.subject) {
                    breadcrumb.push({
                        '@type': 'ListItem',
                        position: 2,
                        name: d.subject,
                        item: `${base}/discover/${slugify(d.subject)}`,
                    });
                }
                breadcrumb.push({
                    '@type': 'ListItem',
                    position: breadcrumb.length + 1,
                    name: d.title,
                    item: `${base}/discover/sets/${d.id}`,
                });
                return JSON.stringify({
                    '@context': 'https://schema.org',
                    '@graph': [
                        { '@type': 'BreadcrumbList', itemListElement: breadcrumb },
                        {
                            '@type': 'LearningResource',
                            name: d.title,
                            description: d.description ?? undefined,
                            url: `${base}/discover/sets/${d.id}`,
                            learningResourceType: 'Flashcard deck',
                            educationalLevel: d.subject ?? undefined,
                            author: authorName.value
                                ? { '@type': 'Person', name: authorName.value }
                                : undefined,
                            hasPart: d.cards.map((c) => ({
                                '@type': 'Flashcard',
                                name: c.word,
                                text: c.definition,
                            })),
                        },
                    ],
                });
            }),
        },
    ],
});
</script>
