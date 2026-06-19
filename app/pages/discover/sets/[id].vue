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
                <span>{{ t('deck.cardCount').replace('{n}', String(deck.cardCount)) }}</span>
                <span class="text-brand-muted/60">·</span>
                <span>{{ t('discover.copies').replace('{n}', String(deck.copyCount)) }}</span>
                <span class="text-brand-muted/60">·</span>
                <span>{{ t('discover.byAuthor').replace('{name}', authorName) }}</span>
            </div>
            <div class="mt-2 flex gap-3">
                <UiButton variant="primary" @click="onCopy">{{ t('discover.copy') }}</UiButton>
            </div>
        </header>

        <ul class="flex flex-col gap-3">
            <li
                v-for="card in deck.cards"
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
    </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { createError, useHead, useRoute, useSiteConfig, useToast, useT } from '#imports';
import { getPublicDeck } from '@/api/publicDiscover';
import { copyDeck } from '@/api/discover';
import { useAuthStore } from '@/stores/auth';

definePageMeta({ layout: 'default' });

const { t } = useT();
const route = useRoute();
const toast = useToast();
const auth = useAuthStore();
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

const authorName = computed(
    () => deck.value?.author?.username ?? deck.value?.author?.fullName ?? 'someone',
);

useSeo({
    title: t('seo.deckTitle').replace('{title}', deck.value?.title ?? ''),
    description: deck.value?.description
        ? deck.value.description
        : t('seo.deckDesc').replace('{title}', deck.value?.title ?? ''),
});

const onCopy = async () => {
    if (!auth.isAuthenticated) {
        await navigateTo('/login?tab=register');
        return;
    }
    try {
        const copy = await copyDeck(id.value);
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
                            author: { '@type': 'Person', name: authorName.value },
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
