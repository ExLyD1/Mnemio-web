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
            <SharedFilterChips v-model="filter" :options="discover.filters.value" />
            <SharedSortMenu v-model="sort" :options="discover.sorts.value" />
        </div>

        <div v-if="discover.categories.value.length">
            <h2 class="mb-3 font-display text-h2 text-cream">{{ t('discover.categories') }}</h2>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <button
                    v-for="cat in discover.categories.value"
                    :key="cat.subject"
                    type="button"
                    class="flex items-center justify-between rounded-2xl border border-line border-l-2 border-l-brand-bright bg-bg-surface px-5 py-4 text-left transition-transform hover:translate-x-0.5"
                    @click="onCategory(cat.subject)"
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
                </button>
            </div>
        </div>

        <div
            v-if="discover.featured.value.length"
            class="rounded-[20px] border border-line bg-mimi-ambient p-5"
        >
            <p class="mb-3 text-eyebrow uppercase text-brand-pale">{{ t('discover.featured') }}</p>
            <div class="grid gap-4 md:grid-cols-3">
                <SharedDeckCard
                    v-for="vm in discover.featured.value"
                    :key="vm.id"
                    :deck="vm"
                    variant="discover"
                    to="/discover"
                    @preview="onPreview"
                    @copy="onCopy"
                />
            </div>
        </div>

        <div v-if="discover.decks.value.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SharedDeckCard
                v-for="vm in discover.decks.value"
                :key="vm.id"
                :deck="vm"
                variant="discover"
                to="/discover"
                @preview="onPreview"
                @copy="onCopy"
            />
        </div>
        <p v-else-if="!discover.loading.value" class="text-body text-brand-muted">
            {{ t('discover.noResults') }}
        </p>

        <div
            class="flex flex-col items-center gap-5 rounded-[20px] border border-line bg-mimi-ambient p-6 text-center sm:flex-row sm:text-left"
        >
            <SharedMimi :size="96" placement="left" />
            <div class="flex-1">
                <p class="font-display text-h2 text-cream">{{ t('discover.ctaTitle') }}</p>
                <p class="mt-1 text-body text-cream-dim">{{ t('discover.ctaSubtitle') }}</p>
            </div>
            <UiButton variant="primary" @click="navigateTo('/decks/create')">{{
                t('discover.ctaButton')
            }}</UiButton>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import { useToast, useT } from '#imports';
import { useDebounceFn } from '@vueuse/core';
import { useDiscover } from '@/composables/useDiscover';

definePageMeta({ layout: 'default' });

const discover = useDiscover();
const toast = useToast();
const { t } = useT();
const route = useRoute();

useSeo({ title: t('seo.discoverTitle'), description: t('seo.appDesc'), noindex: true });

// Prefill from ?q so the header search (and "See all results") lands here with the query.
const search = ref(typeof route.query.q === 'string' ? route.query.q : '');
const filter = ref('all');
const subject = ref<string | null>(null);
const sort = ref<'recent' | 'popular'>('recent');

const reload = () =>
    discover.load({
        q: search.value.trim() || undefined,
        lang: filter.value === 'all' ? undefined : filter.value,
        subject: subject.value || undefined,
        sort: sort.value,
    });

const debouncedReload = useDebounceFn(reload, 300);

watch([filter, subject, sort], reload);
watch(search, debouncedReload);
// React when the header search navigates here again with a new ?q while mounted.
watch(
    () => route.query.q,
    (q) => {
        const next = typeof q === 'string' ? q : '';
        if (next !== search.value) {
            search.value = next;
        }
    },
);

const onCategory = (s: string) => {
    subject.value = subject.value === s ? null : s;
};

const onCopy = async (deckId: string) => {
    try {
        const copy = await discover.copyDeck(deckId);
        toast.success(t('discover.copied'));
        await navigateTo(`/decks/${copy.id}`);
    } catch {
        toast.error(t('discover.copyError'));
    }
};

const onPreview = () => toast.info(t('discover.previewSoon'));

onMounted(reload);
</script>
