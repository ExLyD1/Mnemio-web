<template>
    <section class="mx-auto max-w-5xl p-8 transition-all" :class="mimiOpen ? 'lg:mr-80' : ''">
        <nav class="mb-5 flex items-center gap-1.5 text-small text-brand-muted">
            <NuxtLink to="/decks" class="transition-colors hover:text-brand-pale">{{
                t('dashboard.decks')
            }}</NuxtLink>
            <span>/</span>
            <NuxtLink :to="`/decks/${id}`" class="transition-colors hover:text-brand-pale">
                {{ deckTitle }}
            </NuxtLink>
            <span>/</span>
            <span class="text-brand-pale">{{ t('card.add') }}</span>
        </nav>

        <div class="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div class="flex max-w-xl flex-col gap-5">
                <div>
                    <h1 class="font-display text-display-sm text-cream">
                        {{ t('card.addHeading') }}
                    </h1>
                    <p class="mt-1 text-body text-cream-dim">
                        {{
                            t('card.cardInDeck')
                                .replace('{n}', String(nextNumber))
                                .replace('{deck}', deckTitle)
                        }}
                    </p>
                </div>

                <UiTextarea
                    v-model="front"
                    :label="t('card.front')"
                    :rows="2"
                    serif
                    :placeholder="t('card.frontPlaceholder')"
                />

                <div class="flex gap-2">
                    <input
                        ref="audioInput"
                        type="file"
                        accept="audio/*"
                        class="hidden"
                        @change="onPick($event, 'card_audio')"
                    />
                    <button
                        type="button"
                        :class="chipClass(!!audioUrl)"
                        @click="audioInput?.click()"
                    >
                        <UiSpinner v-if="uploading === 'card_audio'" size="sm" />
                        <component :is="audioUrl ? Check : Volume2" v-else class="size-4" />
                        {{ audioUrl ? t('card.audioAdded') : t('card.addAudio') }}
                    </button>

                    <input
                        ref="imageInput"
                        type="file"
                        accept="image/*"
                        class="hidden"
                        @change="onPick($event, 'card_image')"
                    />
                    <button
                        type="button"
                        :class="chipClass(!!imageUrl)"
                        @click="imageInput?.click()"
                    >
                        <UiSpinner v-if="uploading === 'card_image'" size="sm" />
                        <component :is="imageUrl ? Check : Image" v-else class="size-4" />
                        {{ imageUrl ? t('card.imageAdded') : t('card.addImage') }}
                    </button>
                </div>

                <UiTextarea
                    v-model="back"
                    :label="t('study.meaning')"
                    :rows="4"
                    :maxlength="200"
                    :placeholder="t('card.backPlaceholder')"
                />

                <div>
                    <span class="mb-1.5 block text-small text-brand-muted">{{
                        t('card.tags')
                    }}</span>
                    <UiChipInput v-model="tags" :placeholder="t('card.tagsPlaceholder')" />
                </div>

                <div>
                    <span class="mb-1.5 block text-small text-brand-muted">{{
                        t('card.difficulty')
                    }}</span>
                    <UiRadioCards v-model="difficulty" :options="difficultyOptions" />
                </div>

                <div class="flex gap-2">
                    <UiButton
                        variant="ghost"
                        :disabled="!canSubmit || addCard.loading.value"
                        @click="onAddNext"
                    >
                        {{ t('card.addNext') }}
                    </UiButton>
                    <UiButton
                        variant="primary"
                        :disabled="!canSubmit || addCard.loading.value"
                        @click="onDone"
                    >
                        {{ t('card.done') }}
                    </UiButton>
                </div>
            </div>

            <div class="self-start lg:sticky lg:top-8">
                <SharedCardPreview :front="front" :back="back" :tags="tags" />
            </div>
        </div>
    </section>

    <!-- Floating Mimi button -->
    <button
        type="button"
        class="fixed bottom-6 right-6 z-30 flex size-14 items-center justify-center rounded-full bg-brand shadow-soft-elevation transition-transform hover:scale-105 active:scale-95"
        :aria-label="t('card.mimiHelp')"
        @click="mimiOpen = !mimiOpen"
    >
        <SharedMimi :size="40" class="pointer-events-none" />
    </button>

    <!-- Docked Mimi enrich panel -->
    <Transition name="panel-slide">
        <div
            v-if="mimiOpen"
            class="fixed inset-y-0 right-0 z-20 flex w-80 flex-col border-l border-line bg-bg-surface shadow-soft-elevation"
            :style="{ top: '0' }"
        >
            <div class="flex items-center justify-between border-b border-line px-5 py-4">
                <div class="flex items-center gap-2">
                    <SharedMimi :size="32" class="shrink-0" />
                    <p class="font-display text-base text-cream">{{ t('card.mimiPanelTitle') }}</p>
                </div>
                <button
                    type="button"
                    class="grid size-8 place-items-center rounded-full text-brand-muted hover:text-cream"
                    @click="mimiOpen = false"
                >
                    <X class="size-4" />
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-5">
                <div v-if="enrichLoading" class="flex flex-col items-center gap-3 py-8">
                    <UiSpinner />
                    <p class="text-small text-brand-muted">{{ t('card.mimiThinking') }}</p>
                </div>
                <div v-else-if="enrichResult" class="flex flex-col gap-4">
                    <div
                        v-for="(card, i) in enrichResult.cards"
                        :key="i"
                        class="rounded-2xl border border-line bg-bg-surface-2 p-4"
                    >
                        <p class="font-display text-base text-cream">{{ card.word }}</p>
                        <p v-if="card.definition" class="mt-1 text-small text-brand-muted">
                            {{ card.definition }}
                        </p>
                        <p v-if="card.example" class="mt-2 text-small italic text-cream-dim">
                            {{ card.example }}
                        </p>
                        <UiButton
                            variant="ghost"
                            class="mt-3 !py-1 !text-small"
                            @click="applyEnrich(card)"
                        >
                            {{ t('card.mimiApply') }}
                        </UiButton>
                    </div>
                </div>
                <div v-else class="flex flex-col items-center gap-3 py-8 text-center">
                    <p class="text-body text-cream-dim">{{ t('card.mimiHint') }}</p>
                    <UiButton variant="primary" :disabled="!front.trim()" @click="onEnrich">
                        {{ t('card.mimiEnrich') }}
                    </UiButton>
                </div>
            </div>
            <div v-if="enrichResult" class="border-t border-line p-4">
                <UiButton variant="ghost" class="w-full" @click="onEnrich">
                    {{ t('card.mimiRefresh') }}
                </UiButton>
            </div>
        </div>
    </Transition>
    <div v-if="mimiOpen" class="fixed inset-0 z-10 lg:hidden" @click="mimiOpen = false" />
</template>

<script setup lang="ts">
import { Volume2, Image, Check, X } from 'lucide-vue-next';
import { useDecks, useCards, useToast, useT } from '#imports';
import { uploadMedia } from '@/api/media';
import * as aiApi from '@/api/ai';
import type { MediaKind } from '@/api/media';
import type { CardDifficulty } from '@/types/deck';
import type { AiDraftCard } from '@/api/ai';

definePageMeta({ layout: 'default' });

const route = useRoute();
const id = computed(() => String(route.params.id));

const { store, fetchOne } = useDecks();
const { addCard } = useCards();
const toast = useToast();
const { t } = useT();

useSeo({ title: t('seo.cardAddTitle'), description: t('seo.appDesc'), noindex: true });

const front = ref('');
const back = ref('');
const tags = ref<string[]>([]);
const difficulty = ref<CardDifficulty>('medium');
const audioUrl = ref<string | null>(null);
const imageUrl = ref<string | null>(null);
const uploading = ref<MediaKind | null>(null);
const audioInput = ref<HTMLInputElement | null>(null);
const imageInput = ref<HTMLInputElement | null>(null);
const mimiOpen = ref(false);
const enrichLoading = ref(false);
const enrichResult = ref<aiApi.EnrichWordsResult | null>(null);

const difficultyOptions = computed(() => [
    { value: 'easy', label: t('card.diffEasy') },
    { value: 'medium', label: t('card.diffMedium') },
    { value: 'hard', label: t('card.diffHard') },
]);

const deckTitle = computed(() => store.deck?.title ?? t('card.thisDeck'));
const nextNumber = computed(() => (store.deck?.cards.length ?? 0) + 1);
const canSubmit = computed(() => front.value.trim().length > 0 && back.value.trim().length > 0);

const chipClass = (attached: boolean) => [
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-small transition-colors',
    attached
        ? 'border-brand-bright text-cream'
        : 'border-line-strong text-brand-muted hover:text-brand-pale',
];

const onPick = async (e: Event, kind: MediaKind) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    uploading.value = kind;
    try {
        const res = await uploadMedia(kind, file);
        if (kind === 'card_audio') {
            audioUrl.value = res.url;
        } else {
            imageUrl.value = res.url;
        }
        toast.success(t('card.uploaded'));
    } catch {
        toast.error(t('card.uploadFailed'));
    } finally {
        uploading.value = null;
    }
};

const onEnrich = async () => {
    if (!front.value.trim()) return;
    enrichLoading.value = true;
    enrichResult.value = null;
    try {
        const lang = store.deck?.targetLanguage ?? 'en';
        enrichResult.value = await aiApi.enrichWords({
            words: [front.value.trim()],
            targetLanguage: lang,
        });
    } catch {
        // leave enrichResult null — template shows hint
    } finally {
        enrichLoading.value = false;
    }
};

const applyEnrich = (card: AiDraftCard) => {
    if (card.definition) back.value = card.definition;
    mimiOpen.value = false;
};

const reset = () => {
    front.value = '';
    back.value = '';
    tags.value = [];
    difficulty.value = 'medium';
    audioUrl.value = null;
    imageUrl.value = null;
};

const save = async (): Promise<boolean> => {
    await addCard.execute(id.value, {
        word: front.value.trim(),
        definition: back.value.trim(),
        phonetic: null,
        tags: tags.value,
        difficulty: difficulty.value,
        audioUrl: audioUrl.value,
        imageUrl: imageUrl.value,
    });
    if (addCard.error.value) {
        toast.error(addCard.error.value.message);
        return false;
    }
    return true;
};

const onAddNext = async () => {
    if (!canSubmit.value) return;
    if (await save()) {
        toast.success(t('card.added'));
        reset();
    }
};

const onDone = async () => {
    if (!canSubmit.value) return;
    if (await save()) {
        await navigateTo(`/decks/${id.value}`);
    }
};

onMounted(() => {
    if (!store.deck || store.deck.id !== id.value) {
        fetchOne.execute(id.value);
    }
});
</script>

<style scoped>
.panel-slide-enter-active,
.panel-slide-leave-active {
    transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.panel-slide-enter-from,
.panel-slide-leave-to {
    transform: translateX(100%);
}
</style>
