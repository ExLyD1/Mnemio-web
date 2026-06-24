<template>
    <section class="mx-auto max-w-5xl px-10 py-8">
        <NuxtLink
            to="/decks"
            class="mb-5 flex w-fit items-center gap-1.5 text-small text-cream-dim transition-colors hover:text-cream"
        >
            <ArrowLeft class="size-4" /> {{ t('deck.backToDecks') }}
        </NuxtLink>

        <SharedPageLoader v-if="store.loadingDeck && !ready" />

        <div v-else-if="ready" class="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div class="min-w-0 flex flex-col gap-5">
                <div class="relative">
                    <SharedCoverArt :swatch="swatch" class="p-6">
                        <div class="relative flex flex-col gap-[18px]">
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0">
                                    <p class="text-eyebrow uppercase text-cream/70">
                                        {{ eyebrow }}
                                    </p>
                                    <h1
                                        class="mt-1 break-words font-display text-h1 leading-[1.1] text-cream"
                                    >
                                        {{ store.deck.title }}
                                    </h1>
                                    <p class="mt-1 text-small text-cream/80">
                                        {{ store.deck.sourceLanguage.toUpperCase() }} →
                                        {{ store.deck.targetLanguage.toUpperCase() }}
                                    </p>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-2.5">
                                <UiButton
                                    variant="primary"
                                    :disabled="!store.deck.cards.length"
                                    :title="t('deck.studyNowHint')"
                                    @click="navigateTo(`/study/${id}`)"
                                >
                                    {{ t('deck.studyNow') }}
                                </UiButton>
                                <UiButton
                                    variant="ghost"
                                    :disabled="!store.deck.cards.length"
                                    :title="t('deck.practiceAllHint')"
                                    @click="navigateTo(`/study/${id}/flashcard`)"
                                >
                                    {{ t('deck.practiceAll') }}
                                </UiButton>
                                <UiButton variant="ghost" :title="t('deck.share')" @click="onShare">
                                    <Share2 class="size-4" /> {{ t('deck.share') }}
                                </UiButton>
                            </div>
                        </div>
                    </SharedCoverArt>
                    <div class="absolute right-4 top-4">
                        <UiDropdownMenu :items="menuItems" align="right" @select="onMenuSelect">
                            <template #trigger="{ toggle }">
                                <button
                                    type="button"
                                    class="grid size-9 place-items-center rounded-full bg-black/20 text-cream backdrop-blur transition-colors hover:bg-black/35"
                                    :aria-label="t('deck.menuAria')"
                                    @click="toggle"
                                >
                                    <MoreVertical class="size-4" />
                                </button>
                            </template>
                        </UiDropdownMenu>
                    </div>
                </div>

                <div
                    class="flex flex-wrap gap-x-7 gap-y-1.5 rounded-2xl border border-line bg-bg-surface px-[22px] py-3.5"
                >
                    <span class="flex items-baseline gap-1.5">
                        <span class="font-display text-h2 leading-none text-cream">{{
                            store.deck.cards.length
                        }}</span>
                        <span class="text-small text-brand-muted">{{ t('deck.statTotal') }}</span>
                    </span>
                    <span class="flex items-baseline gap-1.5">
                        <span class="font-display text-h2 leading-none text-cream">{{
                            deckStat.mastered
                        }}</span>
                        <span class="text-small text-brand-muted">{{
                            t('deck.statMastered')
                        }}</span>
                    </span>
                    <span class="flex items-baseline gap-1.5">
                        <span class="font-display text-h2 leading-none text-lavender">{{
                            deckStat.due
                        }}</span>
                        <span class="text-small text-brand-muted">{{ t('deck.statDue') }}</span>
                    </span>
                    <span class="flex items-baseline gap-1.5">
                        <span class="font-display text-h2 leading-none text-cream">{{
                            deckStat.new
                        }}</span>
                        <span class="text-small text-brand-muted">{{ t('deck.statNew') }}</span>
                    </span>
                </div>

                <div class="rounded-[20px] border border-line bg-bg-surface p-2">
                    <template v-if="store.deck.cards.length">
                        <div class="flex flex-wrap items-center gap-2 p-2">
                            <UiInputSearch
                                v-model="search"
                                variant="dark"
                                :placeholder="t('deck.cardSearchPlaceholder')"
                                class="min-w-[180px] flex-1 border border-line"
                            />
                            <UiSegmentedControl v-model="filter" :options="filterOptions" />
                        </div>

                        <div class="max-h-[420px] overflow-y-auto">
                            <SharedCardRow
                                v-for="(card, i) in filteredCards"
                                :key="card.id"
                                :index="i + 1"
                                :card="card"
                                :state="cardState(card)"
                                @edit="openEdit"
                                @delete="askDeleteCard"
                            />
                            <div
                                v-if="!filteredCards.length"
                                class="px-4 py-10 text-center text-body text-brand-muted"
                            >
                                {{ t('deck.noCardsMatch') }}
                            </div>
                        </div>

                        <div
                            class="flex flex-wrap gap-[18px] border-t border-line px-[14px] py-[11px] text-small text-brand-muted"
                        >
                            <span class="flex items-center gap-1.5">
                                <span class="size-2.5 rounded-full bg-lavender" />
                                {{ t('deck.statMastered') }}
                            </span>
                            <span class="flex items-center gap-1.5">
                                <span class="size-2.5 rounded-full bg-brand" />
                                {{ t('deck.statLearning') }}
                            </span>
                            <span class="flex items-center gap-1.5">
                                <span class="size-2.5 rounded-full border border-brand-muted" />
                                {{ t('deck.statNew') }}
                            </span>
                        </div>
                    </template>

                    <div v-else class="px-4 py-10 text-center text-body text-brand-muted">
                        {{ t('card.emptyTitle') }}.
                        <NuxtLink
                            :to="`/decks/${id}/cards/add`"
                            class="text-lavender hover:underline"
                        >
                            {{ t('deck.addFirstCard') }}
                        </NuxtLink>
                    </div>
                </div>
            </div>

            <aside class="flex flex-col gap-4 self-start lg:sticky lg:top-6">
                <div class="rounded-[20px] border border-line bg-bg-surface-2 p-6">
                    <div class="grid place-items-center">
                        <SharedProgressRing :pct="deckStat.masteredPct" label="mastered" />
                    </div>
                    <div class="mt-4 w-full border-t border-line pt-4">
                        <SharedBreakdownBar :segments="breakdownSegments" />
                    </div>
                </div>

                <div
                    class="flex flex-col gap-3 rounded-[20px] border border-line bg-mimi-ambient p-[18px]"
                >
                    <SharedMimi :message="coachTip" placement="left" :size="64" />
                    <UiButton
                        v-if="deckStat.due > 0"
                        variant="primary"
                        @click="navigateTo(`/study/${id}`)"
                    >
                        {{ t('dashboard.reviewNow') }}
                    </UiButton>
                    <UiButton
                        v-else-if="store.deck.cards.length"
                        variant="ghost"
                        @click="navigateTo(`/study/${id}`)"
                    >
                        {{ t('deck.study') }}
                    </UiButton>
                </div>

                <div class="flex flex-col gap-2">
                    <UiButton variant="ghost" @click="navigateTo(`/decks/${id}/edit`)">
                        {{ t('deck.edit') }}
                    </UiButton>
                    <UiButton variant="ghost" @click="aiOpen = true">
                        <Sparkles class="size-4" /> {{ t('ai.launchAppend') }}
                    </UiButton>
                    <UiButton variant="primary" @click="navigateTo(`/decks/${id}/cards/add`)">
                        {{ t('card.addCards') }}
                    </UiButton>
                </div>
            </aside>
        </div>

        <UiEmptyState
            v-else
            :title="isNotFound ? t('deck.notFoundTitle') : t('deck.loadErrorTitle')"
            :message="isNotFound ? t('deck.notFoundMessage') : (loadError?.message ?? '')"
        >
            <template #action>
                <UiButton v-if="!isNotFound" variant="primary" @click="load">
                    {{ t('common.retry') }}
                </UiButton>
                <UiButton :variant="isNotFound ? 'primary' : 'ghost'" @click="navigateTo('/decks')">
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

        <UiModal v-model="editOpen" :title="t('card.edit')">
            <div class="flex flex-col gap-4">
                <UiInputField v-model="editWord" :label="t('card.word')" />
                <UiTextarea v-model="editDefinition" :label="t('card.definition')" :rows="3" />
                <UiInputField v-model="editPhonetic" label="Phonetic (optional)" />
            </div>
            <template #footer>
                <UiButton variant="ghost" @click="editOpen = false">{{
                    t('common.cancel')
                }}</UiButton>
                <UiButton
                    variant="primary"
                    :disabled="
                        updateCard.loading.value || !editWord.trim() || !editDefinition.trim()
                    "
                    @click="saveEdit"
                >
                    <UiSpinner v-if="updateCard.loading.value" size="sm" class="mr-2" />
                    {{ t('common.save') }}
                </UiButton>
            </template>
        </UiModal>

        <UiConfirmDialog
            v-model="cardConfirmOpen"
            :title="t('card.deleteTitle')"
            :message="t('card.deleteMessage')"
            :confirm-label="t('card.delete')"
            destructive
            :loading="deleteCard.loading.value"
            @confirm="confirmDeleteCard"
        />

        <AiImportDialog
            v-if="ready && store.deck"
            v-model="aiOpen"
            :deck="{
                id: store.deck.id,
                sourceLanguage: store.deck.sourceLanguage,
                targetLanguage: store.deck.targetLanguage,
            }"
            @done="onAiDone"
        />
    </section>
</template>

<script setup lang="ts">
import { ArrowLeft, MoreVertical, Pencil, Trash2, Sparkles, Share2 } from 'lucide-vue-next';
import { useDecks, useCards, useSrsStore, useToast, useT } from '#imports';
import { isAuthExpiry } from '@/composables/useToast';
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

useSeo({ title: t('seo.deckDetailTitle'), description: t('seo.appDesc'), noindex: true });

// Only treat the loaded deck as renderable when it matches the current route —
// guards against a stale/previous deck flashing for the new URL.
const ready = computed(() => !!store.deck && store.deck.id === id.value);

// A real 404 means the deck is missing or you don't own it. Anything else
// (auth/network) shouldn't masquerade as "deck deleted" — offer a retry instead.
const loadError = computed(() => fetchOne.error.value);
const isNotFound = computed(() => {
    const code = loadError.value?.code;
    return code === 'NOT_FOUND' || code === 'DECK_NOT_FOUND';
});

const confirmOpen = ref(false);
const aiOpen = ref(false);

const onAiDone = () => fetchOne.execute(id.value);

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
        if (!isAuthExpiry(updateCard.error.value.code)) {
            toast.error(updateCard.error.value.message);
        }
        return;
    }
    editOpen.value = false;
    toast.success(t('card.updated'));
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
        if (!isAuthExpiry(deleteCard.error.value.code)) {
            toast.error(deleteCard.error.value.message);
        }
    } else {
        toast.success(t('card.deleted'));
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
const eyebrow = computed(() => store.deck?.subject?.toUpperCase() || 'DECK');
const coachTip = computed(() =>
    deckStat.value.due > 0
        ? t('deck.coachReview').replace('{n}', String(deckStat.value.due))
        : t('deck.coachGood'),
);

const breakdownSegments = computed(() => [
    { label: t('deck.statMastered'), count: deckStat.value.mastered, color: 'bg-lavender' },
    { label: t('deck.statLearning'), count: deckStat.value.learning, color: 'bg-brand' },
    { label: t('deck.statNew'), count: deckStat.value.new, color: 'bg-brand-muted' },
]);

const search = ref('');
const filter = ref('all');
const filterOptions = computed(() => [
    { value: 'all', label: t('deck.filterAll') },
    { value: 'new', label: t('deck.statNew') },
    { value: 'learning', label: t('deck.statLearning') },
    { value: 'mastered', label: t('deck.statMastered') },
    { value: 'due', label: t('deck.statDue') },
]);

const isDue = (card: Card): boolean => {
    const p = srs.progress[card.id];
    return !!p && new Date(p.nextReviewAt).getTime() <= Date.now();
};

const filteredCards = computed(() => {
    const cards = store.deck?.cards ?? [];
    const q = search.value.trim().toLowerCase();
    return cards.filter((card) => {
        if (q) {
            const haystack = `${card.word} ${card.definition} ${card.phonetic ?? ''}`.toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        switch (filter.value) {
            case 'new':
            case 'learning':
            case 'mastered':
                return cardState(card) === filter.value;
            case 'due':
                return isDue(card);
            default:
                return true;
        }
    });
});

const menuItems = computed(() => [
    { key: 'edit', label: t('deck.edit'), icon: Pencil },
    { key: 'delete', label: t('deck.delete'), icon: Trash2, danger: true },
]);

const onShare = async () => {
    const url = `${window.location.origin}/decks/${id.value}`;
    try {
        await navigator.clipboard.writeText(url);
        toast.success(t('deck.linkCopied'));
        return;
    } catch {
        // Clipboard API unavailable (older browser / insecure context) — fall back.
    }
    try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        toast.success(t('deck.linkCopied'));
    } catch {
        toast.error(t('deck.linkCopyError'));
    }
};

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
        if (!isAuthExpiry(remove.error.value.code)) {
            toast.error(t(remove.error.value.message, remove.error.value.message));
        }
    } else {
        toast.success(t('deck.deleted'));
        await navigateTo('/decks');
    }
    confirmOpen.value = false;
};

const load = async () => {
    // The empty state surfaces any load error (with a retry); no toast needed.
    await fetchOne.execute(id.value);
    // SRS enriches card state chips; it should not block first paint of the deck.
    srs.fetchAll().catch(() => {});
};

watch(id, load, { immediate: true });

onBeforeUnmount(() => {
    store.deck = null;
});
</script>
