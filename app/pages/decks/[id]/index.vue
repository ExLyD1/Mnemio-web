<template>
    <section class="mx-auto max-w-5xl p-8">
        <NuxtLink
            to="/decks"
            class="mb-5 flex w-fit items-center gap-1 text-small text-brand-muted transition-colors hover:text-brand-pale"
        >
            <ArrowLeft class="size-4" /> My Decks
        </NuxtLink>

        <div v-if="store.loadingDeck && !store.deck" class="flex justify-center py-16">
            <UiSpinner size="lg" />
        </div>

        <div v-else-if="store.deck" class="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div class="flex flex-col gap-5">
                <SharedCoverArt :swatch="swatch" class="p-6">
                    <div class="relative flex flex-col gap-4">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <p class="text-eyebrow uppercase text-cream/70">Language deck</p>
                                <h1 class="mt-1 font-display text-h1 text-cream">
                                    {{ store.deck.title }}
                                </h1>
                                <p class="mt-1 text-small text-cream/80">
                                    {{ store.deck.cards.length }} cards ·
                                    {{ store.deck.sourceLanguage.toUpperCase() }} →
                                    {{ store.deck.targetLanguage.toUpperCase() }}
                                </p>
                            </div>
                            <UiDropdownMenu :items="menuItems" align="right" @select="onMenuSelect">
                                <template #trigger="{ toggle }">
                                    <button
                                        type="button"
                                        class="grid size-9 place-items-center rounded-full bg-black/25 text-cream backdrop-blur transition-colors hover:bg-black/40"
                                        aria-label="Deck options"
                                        @click="toggle"
                                    >
                                        <MoreVertical class="size-4" />
                                    </button>
                                </template>
                            </UiDropdownMenu>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <UiButton
                                variant="primary"
                                :disabled="!store.deck.cards.length"
                                @click="navigateTo(`/study/${id}`)"
                            >
                                Study now
                            </UiButton>
                            <UiButton
                                variant="ghost"
                                :disabled="!store.deck.cards.length"
                                @click="navigateTo(`/study/${id}/flashcard`)"
                            >
                                Practice all
                            </UiButton>
                        </div>
                    </div>
                </SharedCoverArt>

                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SharedStatTile label="Total" :value="store.deck.cards.length" />
                    <SharedStatTile label="Mastered" :value="deckStat.mastered" />
                    <SharedStatTile label="Due" :value="deckStat.due" tone="plum" />
                    <SharedStatTile label="New" :value="deckStat.new" />
                </div>

                <div class="rounded-[20px] border border-line bg-bg-surface p-2">
                    <div v-if="store.deck.cards.length" class="max-h-[420px] overflow-y-auto">
                        <SharedCardRow
                            v-for="(card, i) in store.deck.cards"
                            :key="card.id"
                            :index="i + 1"
                            :card="card"
                            :state="cardState(card)"
                            @edit="openEdit"
                            @delete="askDeleteCard"
                        />
                    </div>
                    <div v-else class="px-4 py-10 text-center text-body text-brand-muted">
                        No cards yet.
                        <NuxtLink
                            :to="`/decks/${id}/cards/add`"
                            class="text-lavender hover:underline"
                        >
                            Add the first one.
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <aside class="flex flex-col gap-4 self-start lg:sticky lg:top-6">
                <div
                    class="grid place-items-center rounded-[20px] border border-line bg-bg-well p-6"
                >
                    <SharedProgressRing :pct="deckStat.masteredPct" label="mastered" />
                    <div class="mt-4 w-full border-t border-line pt-4 text-center">
                        <p class="text-small text-brand-muted">
                            {{ deckStat.mastered }} of {{ store.deck.cards.length }} cards mastered
                        </p>
                    </div>
                </div>

                <div
                    class="flex items-center gap-3 rounded-[20px] border border-line bg-mimi-ambient p-4"
                >
                    <SharedMimi :message="coachTip" placement="left" :size="64" />
                </div>

                <div class="flex flex-col gap-2">
                    <UiButton variant="ghost" @click="navigateTo(`/decks/${id}/edit`)">
                        Edit deck
                    </UiButton>
                    <UiButton variant="primary" @click="navigateTo(`/decks/${id}/cards/add`)">
                        Add cards
                    </UiButton>
                </div>
            </aside>
        </div>

        <UiEmptyState v-else :title="t('deck.notFoundTitle')" :message="t('deck.notFoundMessage')">
            <template #action>
                <UiButton variant="primary" @click="navigateTo('/decks')">
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
            @confirm="onConfirmDelete"
        />

        <UiModal v-model="editOpen" title="Edit card">
            <div class="flex flex-col gap-4">
                <UiInputField v-model="editWord" label="Word" />
                <UiTextarea v-model="editDefinition" label="Definition" :rows="3" />
                <UiInputField v-model="editPhonetic" label="Phonetic (optional)" />
            </div>
            <template #footer>
                <UiButton variant="ghost" @click="editOpen = false">Cancel</UiButton>
                <UiButton
                    variant="primary"
                    :disabled="
                        updateCard.loading.value || !editWord.trim() || !editDefinition.trim()
                    "
                    @click="saveEdit"
                >
                    <UiSpinner v-if="updateCard.loading.value" size="sm" class="mr-2" />
                    Save
                </UiButton>
            </template>
        </UiModal>

        <UiConfirmDialog
            v-model="cardConfirmOpen"
            title="Delete this card?"
            message="This removes the card from the deck and can't be undone."
            confirm-label="Delete"
            destructive
            :loading="deleteCard.loading.value"
            @confirm="confirmDeleteCard"
        />
    </section>
</template>

<script setup lang="ts">
import { ArrowLeft, MoreVertical, Pencil, Trash2 } from 'lucide-vue-next';
import { useDecks, useCards, useSrsStore, useToast, useT } from '#imports';
import { swatchFor } from '@/utils/coverSwatches';
import type { Card, DeckStats } from '@/types/deck';

definePageMeta({ layout: 'default' });

const route = useRoute();
const id = computed(() => String(route.params.id));

const { store, fetchOne, remove } = useDecks();
const { updateCard, deleteCard } = useCards();
const srs = useSrsStore();
const toast = useToast();
const { t } = useT();

const confirmOpen = ref(false);

const editOpen = ref(false);
const editCardId = ref<string | null>(null);
const editWord = ref('');
const editDefinition = ref('');
const editPhonetic = ref('');
const cardConfirmOpen = ref(false);
const pendingCardId = ref<string | null>(null);

const openEdit = (cardId: string) => {
    const c = store.deck?.cards.find((x) => x.id === cardId);
    if (!c) return;
    editCardId.value = cardId;
    editWord.value = c.word;
    editDefinition.value = c.definition;
    editPhonetic.value = c.phonetic ?? '';
    editOpen.value = true;
};

const saveEdit = async () => {
    if (!editCardId.value) return;
    await updateCard.execute(id.value, editCardId.value, {
        word: editWord.value.trim(),
        definition: editDefinition.value.trim(),
        phonetic: editPhonetic.value.trim() || null,
    });
    if (updateCard.error.value) {
        toast.error(updateCard.error.value.message);
        return;
    }
    editOpen.value = false;
    toast.success('Card updated');
    await fetchOne.execute(id.value);
};

const askDeleteCard = (cardId: string) => {
    pendingCardId.value = cardId;
    cardConfirmOpen.value = true;
};

const confirmDeleteCard = async () => {
    if (!pendingCardId.value) return;
    await deleteCard.execute(id.value, pendingCardId.value);
    if (deleteCard.error.value) {
        toast.error(deleteCard.error.value.message);
    } else {
        toast.success('Card deleted');
        await fetchOne.execute(id.value);
    }
    cardConfirmOpen.value = false;
    pendingCardId.value = null;
};

const EMPTY_STATS: DeckStats = {
    total: 0,
    mastered: 0,
    learning: 0,
    new: 0,
    due: 0,
    masteredPct: 0,
};

const swatch = computed(() => store.deck?.coverColor ?? swatchFor(id.value));
const deckStat = computed(() => store.deck?.stats ?? EMPTY_STATS);
const coachTip = computed(() =>
    deckStat.value.due > 0
        ? `${deckStat.value.due} cards are ready for review. Want to start?`
        : 'Looking good — nothing due right now. Keep it up!',
);

const menuItems = [
    { key: 'edit', label: 'Edit deck', icon: Pencil },
    { key: 'delete', label: 'Delete deck', icon: Trash2, danger: true },
];

const cardState = (card: Card): 'mastered' | 'learning' | 'new' => {
    const p = srs.progress[card.id];
    if (!p) return 'new';
    return p.repetitions >= 3 ? 'mastered' : 'learning';
};

const onMenuSelect = (key: string) => {
    if (key === 'edit') {
        navigateTo(`/decks/${id.value}/edit`);
    } else if (key === 'delete') {
        confirmOpen.value = true;
    }
};

const onConfirmDelete = async () => {
    await remove.execute(id.value);
    if (remove.error.value) {
        toast.error(t(remove.error.value.message, remove.error.value.message));
    } else {
        toast.success(t('deck.deleted'));
        await navigateTo('/decks');
    }
    confirmOpen.value = false;
};

const load = async () => {
    await fetchOne.execute(id.value);
    if (fetchOne.error.value) {
        toast.error(t(fetchOne.error.value.message, fetchOne.error.value.message));
    }
    await srs.fetchAll();
};

watch(id, load, { immediate: true });

onBeforeUnmount(() => {
    store.deck = null;
});
</script>
