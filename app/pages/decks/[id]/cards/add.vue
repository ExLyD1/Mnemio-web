<template>
    <section class="mx-auto max-w-5xl p-8">
        <nav class="mb-5 flex items-center gap-1.5 text-small text-brand-muted">
            <NuxtLink to="/decks" class="transition-colors hover:text-brand-pale">Decks</NuxtLink>
            <span>/</span>
            <NuxtLink :to="`/decks/${id}`" class="transition-colors hover:text-brand-pale">
                {{ deckTitle }}
            </NuxtLink>
            <span>/</span>
            <span class="text-brand-pale">Add card</span>
        </nav>

        <div class="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div class="flex max-w-xl flex-col gap-5">
                <div>
                    <h1 class="font-display text-display-sm text-cream">Add a card.</h1>
                    <p class="mt-1 text-body text-cream-dim">
                        Card {{ nextNumber }} in {{ deckTitle }}.
                    </p>
                </div>

                <UiTextarea
                    v-model="front"
                    label="Front"
                    :rows="2"
                    serif
                    placeholder="Type a word, phrase or prompt…"
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
                        {{ audioUrl ? 'Audio added' : 'Add audio' }}
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
                        {{ imageUrl ? 'Image added' : 'Add image' }}
                    </button>
                </div>

                <UiTextarea
                    v-model="back"
                    label="Meaning"
                    :rows="4"
                    :maxlength="200"
                    placeholder="The meaning, definition or answer learners should produce."
                />

                <div>
                    <span class="mb-1.5 block text-small text-brand-muted">Tags</span>
                    <UiChipInput v-model="tags" placeholder="Add a tag…" />
                </div>

                <div>
                    <span class="mb-1.5 block text-small text-brand-muted">Difficulty</span>
                    <UiRadioCards v-model="difficulty" :options="difficultyOptions" />
                </div>

                <div class="flex gap-2">
                    <UiButton
                        variant="ghost"
                        :disabled="!canSubmit || addCard.loading.value"
                        @click="onAddNext"
                    >
                        Add &amp; next
                    </UiButton>
                    <UiButton
                        variant="primary"
                        :disabled="!canSubmit || addCard.loading.value"
                        @click="onDone"
                    >
                        Done
                    </UiButton>
                </div>
            </div>

            <div class="self-start lg:sticky lg:top-8">
                <SharedCardPreview :front="front" :back="back" :tags="tags" />
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Volume2, Image, Check } from 'lucide-vue-next';
import { useDecks, useCards, useToast } from '#imports';
import { uploadMedia } from '@/api/media';
import type { MediaKind } from '@/api/media';
import type { CardDifficulty } from '@/types/deck';

definePageMeta({ layout: 'default' });

const route = useRoute();
const id = computed(() => String(route.params.id));

const { store, fetchOne } = useDecks();
const { addCard } = useCards();
const toast = useToast();

const front = ref('');
const back = ref('');
const tags = ref<string[]>([]);
const difficulty = ref<CardDifficulty>('medium');
const audioUrl = ref<string | null>(null);
const imageUrl = ref<string | null>(null);
const uploading = ref<MediaKind | null>(null);
const audioInput = ref<HTMLInputElement | null>(null);
const imageInput = ref<HTMLInputElement | null>(null);

const difficultyOptions = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
];

const deckTitle = computed(() => store.deck?.title ?? 'this deck');
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
        toast.success('Uploaded');
    } catch {
        toast.error('Upload failed');
    } finally {
        uploading.value = null;
    }
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
        toast.success('Card added');
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
