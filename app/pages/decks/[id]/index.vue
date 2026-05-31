<template>
    <section class="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        <button
            type="button"
            class="flex w-fit items-center gap-1 text-small text-brand-muted transition-colors hover:text-brand-pale"
            @click="navigateTo('/decks')"
        >
            <ArrowLeft class="size-4" /> {{ t('deck.backToDecks') }}
        </button>

        <div v-if="store.loadingDeck && !store.deck" class="flex justify-center py-12">
            <UiSpinner size="lg" />
        </div>

        <template v-else-if="store.deck">
            <DeckHeader
                :deck="store.deck"
                @study="onStudy"
                @edit="navigateTo(`/decks/${store.deck.id}/edit`)"
                @delete="confirmOpen = true"
            />

            <CardForm :loading="addCard.loading.value" @submit="onAddCard" />

            <CardList
                :cards="visibleCards"
                :has-more="visibleCount < store.deck.cards.length"
                :loading-more="false"
                @save="onSaveCard"
                @delete="askDeleteCard"
                @load-more="visibleCount = Math.min(store.deck.cards.length, visibleCount + 50)"
            />
        </template>

        <UiEmptyState
            v-else
            :title="t('deck.notFoundTitle')"
            :message="t('deck.notFoundMessage')"
        >
            <template #action>
                <UiButton variant="light" @click="navigateTo('/decks')">
                    {{ t('deck.backToDecks') }}
                </UiButton>
            </template>
        </UiEmptyState>

        <UiConfirmDialog
            v-model="confirmOpen"
            :title="t('deck.deleteTitle')"
            :message="t('deck.deleteMessage')"
            :confirm-label="t('deck.delete')"
            destructive
            :loading="remove.loading.value"
            @confirm="onConfirmDeleteDeck"
        />

        <UiConfirmDialog
            v-model="cardConfirmOpen"
            :title="t('card.deleteTitle')"
            :message="t('card.deleteMessage')"
            :confirm-label="t('card.delete')"
            destructive
            :loading="deleteCard.loading.value"
            @confirm="onConfirmDeleteCard"
        />
    </section>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
import { useDecks, useCards, useToast, useT } from '#imports';

definePageMeta({ layout: 'default' });

const route = useRoute();
const deckId = computed(() => String(route.params.id));

const { store, fetchOne, remove } = useDecks();
const { addCard, updateCard, deleteCard } = useCards();
const toast = useToast();
const { t } = useT();

const confirmOpen = ref(false);
const cardConfirmOpen = ref(false);
const pendingCardId = ref<string | null>(null);
const visibleCount = ref(50);

const visibleCards = computed(() => store.deck?.cards.slice(0, visibleCount.value) ?? []);

const load = async () => {
    await fetchOne.execute(deckId.value);
    visibleCount.value = 50;
    if (fetchOne.error.value) {
        toast.error(t(fetchOne.error.value.message, fetchOne.error.value.message));
    }
};

watch(deckId, load, { immediate: true });

const onStudy = () => navigateTo(`/study/${deckId.value}`);

const onAddCard = async (payload: { word: string; definition: string; phonetic: string | null }) => {
    await addCard.execute(deckId.value, payload);
    if (addCard.error.value) {
        toast.error(t(addCard.error.value.message, addCard.error.value.message));
    }
};

const onSaveCard = async (cardId: string, input: { word: string; definition: string }) => {
    await updateCard.execute(deckId.value, cardId, input);
    if (updateCard.error.value) {
        toast.error(t(updateCard.error.value.message, updateCard.error.value.message));
    }
};

const askDeleteCard = (cardId: string) => {
    pendingCardId.value = cardId;
    cardConfirmOpen.value = true;
};

const onConfirmDeleteCard = async () => {
    if (!pendingCardId.value) return;
    await deleteCard.execute(deckId.value, pendingCardId.value);
    if (deleteCard.error.value) {
        toast.error(t(deleteCard.error.value.message, deleteCard.error.value.message));
    } else {
        toast.success(t('card.deleted'));
    }
    cardConfirmOpen.value = false;
    pendingCardId.value = null;
};

const onConfirmDeleteDeck = async () => {
    await remove.execute(deckId.value);
    if (remove.error.value) {
        toast.error(t(remove.error.value.message, remove.error.value.message));
    } else {
        toast.success(t('deck.deleted'));
        await navigateTo('/decks');
    }
    confirmOpen.value = false;
};

onBeforeUnmount(() => {
    store.deck = null;
});
</script>
