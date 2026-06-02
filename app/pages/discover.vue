<template>
    <section class="mx-auto flex max-w-6xl flex-col gap-6 p-8">
        <header>
            <h1 class="font-display text-display-sm text-cream">Discover decks</h1>
            <p class="mt-1 text-body text-cream-dim">
                Browse community decks and copy them into your library.
            </p>
        </header>

        <UiInputSearch
            v-model="search"
            placeholder="Search decks, topics, languages…"
            variant="dark"
        />

        <div class="flex flex-wrap items-center justify-between gap-3">
            <SharedFilterChips v-model="filter" :options="discover.filters" />
            <SharedSortMenu v-model="sort" :options="discover.sorts" />
        </div>

        <div class="rounded-[20px] border border-line bg-mimi-ambient p-5">
            <p class="mb-3 text-eyebrow uppercase text-brand-pale">Featured</p>
            <div class="grid gap-4 md:grid-cols-3">
                <SharedDeckCard
                    v-for="vm in discover.featured"
                    :key="vm.id"
                    :deck="vm"
                    variant="discover"
                    to="/discover"
                    @preview="onSoon"
                    @copy="onSoon"
                />
            </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SharedDeckCard
                v-for="vm in visibleDecks"
                :key="vm.id"
                :deck="vm"
                variant="discover"
                to="/discover"
                @preview="onSoon"
                @copy="onSoon"
            />
        </div>

        <div>
            <h2 class="mb-3 font-display text-h2 text-cream">Categories</h2>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <button
                    v-for="cat in discover.categories"
                    :key="cat.name"
                    type="button"
                    class="flex items-center justify-between rounded-2xl border border-line border-l-2 border-l-brand-bright bg-bg-surface px-5 py-4 text-left transition-transform hover:translate-x-0.5"
                    @click="onSoon"
                >
                    <span>
                        <span class="block font-display text-h3 text-cream">{{ cat.name }}</span>
                        <span class="text-small text-brand-muted">{{ cat.count }} decks</span>
                    </span>
                    <ArrowRight class="size-4 text-brand-muted" />
                </button>
            </div>
        </div>

        <div
            class="flex flex-col items-center gap-5 rounded-[20px] border border-line bg-mimi-ambient p-6 text-center sm:flex-row sm:text-left"
        >
            <SharedMimi :size="96" placement="left" />
            <div class="flex-1">
                <p class="font-display text-h2 text-cream">Can’t find what you need?</p>
                <p class="mt-1 text-body text-cream-dim">Build your own deck in minutes.</p>
            </div>
            <UiButton variant="primary" @click="navigateTo('/decks/create')"
                >Create a deck</UiButton
            >
        </div>
    </section>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import { useToast } from '#imports';
import { useDiscover } from '@/composables/useDiscover';

definePageMeta({ layout: 'default' });

const discover = useDiscover();
const toast = useToast();

const search = ref('');
const filter = ref('all');
const sort = ref('popular');

const visibleDecks = computed(() => {
    let list = discover.decks.filter((d) => filter.value === 'all' || d.tag === filter.value);
    if (search.value.trim()) {
        const q = search.value.trim().toLowerCase();
        list = list.filter((d) => d.title.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
        if (sort.value === 'newest') return a.title.localeCompare(b.title);
        return (b.copies ?? 0) - (a.copies ?? 0);
    });
});

const onSoon = () => toast.info('Copying community decks is coming soon.');
</script>
