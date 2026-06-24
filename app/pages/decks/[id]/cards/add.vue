<template>
    <section
        class="mx-auto max-w-[1100px] p-6 transition-all lg:p-8"
        :class="mimiOpen ? 'lg:pr-[360px]' : ''"
    >
        <div
            class="grid items-start"
            :style="{
                gridTemplateColumns: mimiOpen ? '1fr 340px' : '1fr 400px',
                gap: mimiOpen ? '40px' : '56px',
            }"
        >
            <!-- LEFT — form -->
            <div>
                <h1 class="font-display text-[52px] leading-[1.05] text-cream">
                    {{ t('card.addHeading') }}
                </h1>
                <p class="mb-7 mt-2.5 text-[16px] text-cream-dim">
                    {{
                        t('card.cardInDeck')
                            .replace('{n}', String(nextNumber))
                            .replace('{deck}', deckTitle)
                    }}
                </p>

                <!-- Front field -->
                <div class="card-field">
                    <p class="mb-1.5 text-[12px] text-cream-dim">{{ t('card.front') }}</p>
                    <textarea
                        v-model="front"
                        class="block w-full resize-none bg-transparent font-display text-[28px] italic leading-snug text-cream-faint outline-none placeholder:text-cream-faint/60"
                        rows="2"
                        :placeholder="t('card.frontPlaceholder')"
                    />
                </div>

                <!-- Audio / image chips -->
                <div class="mt-3 flex gap-2.5">
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
                        <component :is="imageUrl ? Check : ImageIcon" v-else class="size-4" />
                        {{ imageUrl ? t('card.imageAdded') : t('card.addImage') }}
                    </button>
                </div>

                <!-- Meaning field -->
                <div class="card-field mt-[18px]">
                    <p class="mb-1.5 text-[12px] text-cream-dim">{{ t('card.meaning') }}</p>
                    <textarea
                        v-model="back"
                        class="block w-full resize-none bg-transparent text-[16px] text-cream-faint outline-none placeholder:text-cream-faint/60"
                        style="min-height: 92px"
                        :maxlength="200"
                        :placeholder="t('card.backPlaceholder')"
                    />
                    <p class="mt-1 text-right text-[12px] text-cream-faint/60">
                        {{ back.length }}/200
                    </p>
                </div>

                <!-- Tags -->
                <div class="mt-[18px]">
                    <p class="mb-2 text-[13px] text-cream-dim">{{ t('card.tags') }}</p>
                    <div class="card-field py-3">
                        <UiChipInput v-model="tags" :placeholder="t('card.tagsPlaceholder')" />
                    </div>
                </div>

                <!-- Difficulty -->
                <div class="mt-[18px]">
                    <p class="mb-2 text-[13px] text-cream-dim">{{ t('card.difficulty') }}</p>
                    <div class="flex gap-3">
                        <button
                            v-for="opt in difficultyOptions"
                            :key="opt.value"
                            type="button"
                            class="flex flex-1 cursor-pointer items-center justify-between rounded-xl border px-[18px] py-3.5 transition-colors"
                            :class="
                                difficulty === opt.value
                                    ? 'border-brand-bright/55 bg-brand/30'
                                    : 'border-line-strong bg-bg-well/30 hover:border-line'
                            "
                            @click="difficulty = opt.value"
                        >
                            <span class="text-[15px] font-semibold text-cream">{{
                                opt.label
                            }}</span>
                            <span
                                class="grid size-4 place-items-center rounded-full border-[1.5px]"
                                :class="
                                    difficulty === opt.value
                                        ? 'border-lavender'
                                        : 'border-cream-faint/60'
                                "
                            >
                                <span
                                    v-if="difficulty === opt.value"
                                    class="size-2 rounded-full bg-lavender"
                                />
                            </span>
                        </button>
                    </div>
                </div>

                <!-- Actions -->
                <div class="mt-[26px] flex items-center gap-3">
                    <UiButton variant="ghost" @click="navigateTo(`/decks/${id}`)">
                        {{ t('common.back') }}
                    </UiButton>
                    <div class="flex flex-1 justify-end gap-3">
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
            </div>

            <!-- RIGHT — tall card preview -->
            <div class="pt-6">
                <div
                    class="flex w-full flex-col items-center justify-between rounded-[22px] border border-line-strong px-6 py-7"
                    :style="{
                        height: '480px',
                        background: 'var(--c-fc-front)',
                        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.35)',
                    }"
                >
                    <span
                        class="text-[11px] font-semibold uppercase tracking-[.22em] text-cream-faint"
                        >FRONT</span
                    >
                    <p class="font-display text-[36px] text-cream-dim">
                        {{ front || 'Your word…' }}
                    </p>
                    <span class="text-[13px] text-cream-faint">Tap to flip</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Floating Mimi button (hidden when panel open) -->
    <button
        v-if="!mimiOpen"
        type="button"
        class="fixed bottom-[26px] right-[28px] z-30 grid size-[58px] cursor-pointer place-items-center rounded-full border border-[rgba(242,188,255,.35)] p-0"
        style="
            background: linear-gradient(150deg, #572f54, #2c1a2a);
            box-shadow: 0 10px 28px -6px rgba(169, 142, 227, 0.3);
        "
        :aria-label="t('card.mimiHelp')"
        @click="openMimi"
    >
        <SharedMimi :size="40" :bob="false" class="pointer-events-none" />
    </button>

    <!-- Docked Mimi chat panel.
         Mobile: full-screen overlay above the bottom tab bar (reachable input).
         Desktop: docked side panel below the topbar. -->
    <Transition name="panel-slide">
        <div
            v-if="mimiOpen"
            class="fixed inset-0 z-50 flex w-full flex-col border-line-strong bg-bg-well md:left-auto md:top-16 md:z-30 md:w-[340px] md:border-l"
        >
            <!-- Header -->
            <div class="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
                <SharedMimi :size="30" class="shrink-0" />
                <div class="flex-1">
                    <p class="text-[14px] font-bold text-cream">{{ t('card.mimiChatTitle') }}</p>
                </div>
                <button
                    type="button"
                    class="grid size-8 place-items-center text-cream-faint hover:text-cream"
                    @click="mimiOpen = false"
                >
                    <X class="size-4" />
                </button>
            </div>

            <!-- Messages -->
            <div ref="chatBodyEl" class="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3.5">
                <template v-for="(msg, i) in chatMessages" :key="i">
                    <div
                        v-if="msg.role === 'mimi'"
                        class="max-w-[88%] self-start rounded-[4px_14px_14px_14px] border border-line bg-bg-surface px-3 py-2.5 text-[13px] leading-[1.5] text-cream"
                        v-html="msg.html"
                    />
                    <div
                        v-else-if="msg.role === 'user'"
                        class="max-w-[88%] self-end rounded-[14px_4px_14px_14px] border border-[rgba(242,188,255,.25)] bg-brand px-3 py-2.5 text-[13px] leading-[1.5] text-on-color"
                    >
                        {{ msg.text }}
                    </div>
                </template>

                <div v-if="chatLoading" class="flex items-center gap-2">
                    <div
                        class="flex items-center gap-1 rounded-[4px_14px_14px_14px] bg-bg-surface px-3 py-3 text-cream-faint"
                    >
                        <span class="mimi-dot" />
                        <span class="mimi-dot" />
                        <span class="mimi-dot" />
                    </div>
                </div>
            </div>

            <!-- Input -->
            <div class="border-t border-line p-3">
                <div
                    class="flex items-center gap-2 rounded-xl border border-line-strong bg-bg-surface px-3 py-2.5"
                >
                    <input
                        v-model="chatInput"
                        class="min-w-0 flex-1 bg-transparent text-[13px] text-cream-faint outline-none placeholder:text-cream-faint"
                        :placeholder="t('deck.aiInputPlaceholder')"
                        :disabled="chatLoading"
                        @keydown.enter.prevent="onChatSend"
                    />
                    <button
                        type="button"
                        class="grid size-7 shrink-0 place-items-center rounded-lg bg-brand text-on-color disabled:opacity-40"
                        :disabled="!chatInput.trim() || chatLoading"
                        @click="onChatSend"
                    >
                        <ArrowRight class="size-3.5" />
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { Volume2, Image as ImageIcon, Check, X, ArrowRight } from 'lucide-vue-next';
import { useDecks, useCards, useToast, useT } from '#imports';
import { uploadMedia } from '@/api/media';
import { useAnalytics } from '@/composables/useAnalytics';
import * as aiApi from '@/api/ai';
import type { MediaKind } from '@/api/media';
import type { CardDifficulty } from '@/types/deck';

definePageMeta({ layout: 'default' });

const route = useRoute();
const id = computed(() => String(route.params.id));

const { store, fetchOne } = useDecks();
const { addCard } = useCards();
const toast = useToast();
const { t } = useT();
const analytics = useAnalytics();

// Whether AI enrichment touched the current card (drives card_added.method).
const usedEnrich = ref(false);

useSeo({ title: t('seo.cardAddTitle'), description: t('seo.appDesc'), noindex: true });

// --- Card form state ---
const front = ref('');
const back = ref('');
const tags = ref<string[]>([]);
const difficulty = ref<CardDifficulty>('medium');
const audioUrl = ref<string | null>(null);
const imageUrl = ref<string | null>(null);
const uploading = ref<MediaKind | null>(null);
const audioInput = ref<HTMLInputElement | null>(null);
const imageInput = ref<HTMLInputElement | null>(null);

// --- Mimi chat state ---
type ChatMsg = { role: 'mimi'; html: string } | { role: 'user'; text: string };

const mimiOpen = ref(false);
const chatBodyEl = ref<HTMLElement | null>(null);
const chatMessages = ref<ChatMsg[]>([]);
const chatInput = ref('');
const chatLoading = ref(false);

const difficultyOptions = computed(() => [
    { value: 'easy', label: t('card.diffEasy') },
    { value: 'medium', label: t('card.diffMedium') },
    { value: 'hard', label: t('card.diffHard') },
]);

const deckTitle = computed(() => store.deck?.title ?? t('card.thisDeck'));
const nextNumber = computed(() => (store.deck?.cards.length ?? 0) + 1);
const canSubmit = computed(() => front.value.trim().length > 0 && back.value.trim().length > 0);

const chipClass = (attached: boolean) => [
    'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors',
    attached
        ? 'border-lavender/60 text-cream'
        : 'border-line-strong text-cream-dim hover:text-cream',
];

const scrollChat = () => {
    nextTick(() => {
        if (chatBodyEl.value) chatBodyEl.value.scrollTop = chatBodyEl.value.scrollHeight;
    });
};

const openMimi = () => {
    mimiOpen.value = true;
    if (!chatMessages.value.length) {
        const word = front.value.trim();
        const cardNum = nextNumber.value;
        const deck = deckTitle.value;
        chatMessages.value.push({
            role: 'mimi',
            html: word
                ? `I see you're on card ${cardNum} of <b>${deck}</b>. Want me to draft the meaning for "<b>${word}</b>"?`
                : `I'm here to help with card ${cardNum} of <b>${deck}</b>. Type a word on the left, and I'll draft the meaning.`,
        });
        scrollChat();
    }
};

const callEnrich = async (fields: aiApi.EnrichField[]) => {
    if (!front.value.trim()) {
        chatMessages.value.push({
            role: 'mimi',
            html: `Type a word in the Front field first, then I can help!`,
        });
        scrollChat();
        return;
    }
    chatLoading.value = true;
    scrollChat();
    const startedAt = Date.now();
    analytics.track('ai_feature_started', { ai_feature: 'enrich_words', context: 'card_add' });
    try {
        const res = await aiApi.enrichWords({
            words: [front.value.trim()],
            sourceLanguage: store.deck?.sourceLanguage ?? 'en',
            targetLanguage: store.deck?.targetLanguage ?? 'en',
            fields,
        });
        const card = res.cards[0];
        if (!card) return;
        usedEnrich.value = true;
        analytics.track('ai_feature_completed', {
            ai_feature: 'enrich_words',
            context: 'card_add',
            result_size: res.cards.length,
            duration_ms: Date.now() - startedAt,
        });

        if (fields.includes('tags') && card.tags?.length) {
            tags.value = [...new Set([...tags.value, ...(card.tags ?? [])])];
            chatMessages.value.push({
                role: 'mimi',
                html: `Added tags: <b>${card.tags.join(', ')}</b>`,
            });
        } else if (fields.includes('example') && card.example) {
            chatMessages.value.push({
                role: 'mimi',
                html: `Here's a harder example: "<i>${card.example}</i>"`,
            });
        } else if (fields.includes('exampleTranslation') && card.exampleTranslation) {
            chatMessages.value.push({
                role: 'mimi',
                html: `Translation: "<i>${card.exampleTranslation}</i>"`,
            });
        } else if (card.definition) {
            back.value = card.definition;
            chatMessages.value.push({
                role: 'mimi',
                html: `Done — I filled in the meaning. Review it on the left, or tap a quick action below.`,
            });
        } else {
            chatMessages.value.push({
                role: 'mimi',
                html: `I couldn't find data for that word. Try a different term.`,
            });
        }
    } catch {
        chatMessages.value.push({
            role: 'mimi',
            html: `Hmm, something went wrong. Try again?`,
        });
    } finally {
        chatLoading.value = false;
        scrollChat();
    }
};

const onChatSend = async () => {
    const text = chatInput.value.trim();
    if (!text || chatLoading.value) return;
    chatMessages.value.push({ role: 'user', text });
    chatInput.value = '';
    await callEnrich([
        'phonetic',
        'partOfSpeech',
        'example',
        'exampleTranslation',
        'tags',
        'difficulty',
    ]);
};

const onQuickAction = async (action: 'tags' | 'harder' | 'translate') => {
    const labels: Record<string, string> = {
        tags: t('card.mimiSuggestTags'),
        harder: t('card.mimiHarderExample'),
        translate: t('card.mimiTranslate'),
    };
    chatMessages.value.push({ role: 'user', text: labels[action]! });
    if (action === 'tags') await callEnrich(['tags']);
    else if (action === 'harder') await callEnrich(['example']);
    else await callEnrich(['exampleTranslation']);
};

// --- Media upload ---
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

// --- Card save ---
const reset = () => {
    front.value = '';
    back.value = '';
    tags.value = [];
    difficulty.value = 'medium';
    audioUrl.value = null;
    imageUrl.value = null;
    chatMessages.value = [];
    usedEnrich.value = false;
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
    analytics.track('card_added', {
        deck_id: id.value,
        method: usedEnrich.value ? 'ai_enriched' : 'manual',
        count: 1,
    });
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
.card-field {
    border: 1px solid rgb(var(--c-line) / 0.18);
    border-radius: 14px;
    padding: 12px 16px 14px;
    background: rgb(var(--c-bg-surface));
}

.panel-slide-enter-active,
.panel-slide-leave-active {
    transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.panel-slide-enter-from,
.panel-slide-leave-to {
    transform: translateX(100%);
}

@keyframes mimi-dot-pulse {
    0%,
    60%,
    100% {
        opacity: 0.3;
        transform: scale(0.8);
    }
    30% {
        opacity: 1;
        transform: scale(1);
    }
}
.mimi-dot {
    width: 5px;
    height: 5px;
    border-radius: 9999px;
    background: currentColor;
    animation: mimi-dot-pulse 1.2s ease-in-out infinite;
}
.mimi-dot:nth-child(2) {
    animation-delay: 0.2s;
}
.mimi-dot:nth-child(3) {
    animation-delay: 0.4s;
}
</style>
