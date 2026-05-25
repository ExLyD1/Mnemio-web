<template>
    <section class="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 class="text-h1 font-bold text-neutral-0">{{ t('deck.myDecks') }}</h1>
            <UiButton variant="light" @click="navigateTo('/decks/create')">
                {{ t('deck.create') }}
            </UiButton>
        </header>

        <UiInputSearch
            :model-value="searchInput"
            :placeholder="t('deck.searchPlaceholder')"
            variant="dark"
            @update:model-value="onSearch"
        />

        <div v-if="store.loadingList && !store.summaries.length" class="flex justify-center py-12">
            <UiSpinner size="lg" />
        </div>

        <UiEmptyState
            v-else-if="!store.summaries.length && !store.search"
            :icon="LayoutGrid"
            :title="t('deck.emptyTitle')"
            :message="t('deck.emptyMessage')"
        >
            <template #action>
                <UiButton variant="light" @click="navigateTo('/decks/create')">
                    {{ t('deck.createFirst') }}
                </UiButton>
            </template>
        </UiEmptyState>

        <UiEmptyState
            v-else-if="!store.summaries.length"
            :icon="Search"
            :title="t('deck.noResultsTitle')"
            :message="t('deck.noResultsMessage')"
        />

        <template v-else>
            <DeckGrid :decks="store.summaries" @edit="onEdit" @delete="askDelete" />
            <div v-if="store.nextCursor" class="flex justify-center">
                <UiButton variant="ghost" :disabled="store.loadingList" @click="store.loadMore()">
                    <UiSpinner v-if="store.loadingList" size="sm" class="mr-2" />
                    {{ t('common.loadMore') }}
                </UiButton>
            </div>
        </template>

        <UiConfirmDialog
            v-model="confirmOpen"
            :title="t('deck.deleteTitle')"
            :message="t('deck.deleteMessage')"
            :confirm-label="t('deck.delete')"
            destructive
            :loading="remove.loading.value"
            @confirm="onConfirmDelete"
        />
    </section>
</template>

<script setup lang="ts">
import { LayoutGrid, Search } from 'lucide-vue-next';
import { useDebounceFn } from '@vueuse/core';
import { useDecks, useToast, useT } from '#imports';

definePageMeta({ layout: 'default' });

const { store, fetchList, remove } = useDecks();
const toast = useToast();
const { t } = useT();

const searchInput = ref(store.search);
const confirmOpen = ref(false);
const pendingDeleteId = ref<string | null>(null);

const debouncedSearch = useDebounceFn(async (q: string) => {
    await store.setSearch(q);
}, 300);

const onSearch = (value: string) => {
    searchInput.value = value;
    debouncedSearch(value);
};

const onEdit = (id: string) => navigateTo(`/decks/${id}/edit`);

const askDelete = (id: string) => {
    pendingDeleteId.value = id;
    confirmOpen.value = true;
};

const onConfirmDelete = async () => {
    if (!pendingDeleteId.value) return;
    const id = pendingDeleteId.value;
    await remove.execute(id);
    if (remove.error.value) {
        toast.error(t(remove.error.value.message, remove.error.value.message));
    } else {
        toast.success(t('deck.deleted'));
    }
    confirmOpen.value = false;
    pendingDeleteId.value = null;
};

onMounted(() => {
    fetchList.execute({ cursor: null, append: false });
});

onBeforeUnmount(() => {
    store.reset();
});
</script>
