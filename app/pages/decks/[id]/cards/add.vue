<template>
    <div>
        <section
            class="mx-auto max-w-[1100px] p-6 transition-all lg:p-8"
            :class="mimiOpen ? 'lg:pr-[360px]' : ''"
        >
            <div class="grid items-start gap-10 lg:grid-cols-[1fr_400px] lg:gap-14">
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

                    <!-- Front field — word completion suggestions while typing (#6) -->
                    <div class="card-field">
                        <p class="mb-1.5 text-[12px] text-cream-dim">{{ t('card.front') }}</p>
                        <CardTermSuggestInput
                            v-model="front"
                            :lang="store.deck?.targetLanguage ?? 'en'"
                            :existing-words="existingWords"
                            source="card_add"
                        >
                            <template
                                #default="{
                                    value,
                                    onInput: onFrontInput,
                                    onKeydown: onFrontKeydown,
                                    onBlur: onFrontBlur,
                                    ariaExpanded,
                                }"
                            >
                                <textarea
                                    :value="value"
                                    role="combobox"
                                    :aria-expanded="ariaExpanded"
                                    aria-haspopup="listbox"
                                    aria-autocomplete="list"
                                    autocomplete="off"
                                    autocapitalize="off"
                                    spellcheck="false"
                                    enterkeyhint="done"
                                    class="block w-full resize-none bg-transparent font-display text-[28px] italic leading-snug text-cream-faint outline-none placeholder:text-cream-faint/60"
                                    rows="2"
                                    :placeholder="t('card.frontPlaceholder')"
                                    @input="onFrontInput"
                                    @keydown="onFrontKeydown"
                                    @blur="onFrontBlur"
                                />
                            </template>
                        </CardTermSuggestInput>
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

                    <!-- Meaning field — auto-suggested translation while empty (#7) -->
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
                        <CardTranslationSuggestion
                            :term="front"
                            :from="store.deck?.targetLanguage ?? 'en'"
                            :to="store.deck?.sourceLanguage ?? 'en'"
                            :definition-empty="back.trim().length === 0"
                            source="card_add"
                            @accept="back = $event"
                        />
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
                                    class="grid size-4 place-items-center rounded-full border-[1.5px] transition-colors"
                                    :class="
                                        difficulty === opt.value
                                            ? 'border-lavender'
                                            : 'border-cream-faint/60'
                                    "
                                >
                                    <span
                                        class="size-2 rounded-full bg-lavender transition-opacity"
                                        :class="
                                            difficulty === opt.value ? 'opacity-100' : 'opacity-0'
                                        "
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
                                @click="onDone"
                            >
                                {{ t('card.done') }}
                            </UiButton>
                            <UiButton
                                variant="primary"
                                :disabled="!canSubmit || addCard.loading.value"
                                @click="onAddNext"
                            >
                                <UiSpinner v-if="addCard.loading.value" size="sm" class="mr-1" />
                                {{ t('card.addNext') }}
                            </UiButton>
                        </div>
                    </div>
                </div>

                <!-- RIGHT — tall card preview (hidden on mobile, shown on lg+) -->
                <div class="hidden pt-6 lg:block">
                    <button
                        type="button"
                        class="flex w-full cursor-pointer flex-col items-center justify-between rounded-[22px] border border-line-strong px-6 py-7 transition-all"
                        :style="{
                            height: '480px',
                            background: previewFlipped ? 'var(--c-fc-back)' : 'var(--c-fc-front)',
                            boxShadow: 'var(--c-shadow-float)',
                        }"
                        :aria-label="previewFlipped ? t('study.showFront') : t('card.tapToFlip')"
                        @click="previewFlipped = !previewFlipped"
                    >
                        <span
                            class="text-[11px] font-semibold uppercase tracking-[.22em] text-cream-faint"
                            >{{ previewFlipped ? t('study.back') : t('study.front') }}</span
                        >
                        <p class="font-display text-[36px] text-cream-dim">
                            {{
                                previewFlipped
                                    ? back || t('card.backPlaceholder').slice(0, 24) + '…'
                                    : front || t('card.previewWordPlaceholder')
                            }}
                        </p>
                        <span class="text-[13px] text-cream-faint">{{ t('card.tapToFlip') }}</span>
                    </button>
                </div>
            </div>
        </section>

        <!-- Floating Mimi button (hidden when panel open) -->
        <button
            v-if="!mimiOpen"
            type="button"
            class="fixed bottom-[26px] right-[28px] z-30 grid size-[58px] cursor-pointer place-items-center rounded-full border border-pink/35 p-0"
            style="
                background: var(--c-hero);
                box-shadow: 0 10px 28px -6px rgb(var(--c-purple) / 0.3);
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
                        <p class="text-[14px] font-bold text-cream">
                            {{ t('card.mimiChatTitle') }}
                        </p>
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
                    <div
                        class="max-w-[88%] self-start rounded-[4px_14px_14px_14px] border border-line bg-bg-surface px-3 py-2.5 text-[13px] leading-[1.5] text-cream"
                    >
                        {{ t('card.mimiGreeting') }}
                    </div>
                    <template v-for="(msg, i) in chatMessages" :key="i">
                        <div
                            v-if="msg.role === 'mimi' && msg.text"
                            class="chat-prose max-w-[88%] self-start rounded-[4px_14px_14px_14px] border border-line bg-bg-surface px-3 py-2.5 text-[13px] leading-[1.5] text-cream"
                            v-html="renderMarkdown(msg.text)"
                        />
                        <div
                            v-else-if="msg.role === 'user'"
                            class="max-w-[88%] self-end whitespace-pre-wrap rounded-[14px_4px_14px_14px] border border-pink/25 bg-brand px-3 py-2.5 text-[13px] leading-[1.5] text-on-color"
                        >
                            {{ msg.text }}
                        </div>
                    </template>

                    <p v-if="chatError" class="self-start px-1 text-[13px] text-pink">
                        {{ chatError }}
                    </p>

                    <div v-if="chatLoading && !streamingText" class="flex items-center gap-2">
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
                    <!-- Starter questions: teach what Mimi can do without a blank page. -->
                    <div class="mb-2.5 flex flex-wrap gap-1.5">
                        <button
                            v-for="chip in chips"
                            :key="chip.key"
                            type="button"
                            class="rounded-full border border-line-strong px-3 py-1.5 text-[12px] font-semibold text-cream-dim transition-colors hover:text-cream disabled:opacity-40"
                            :disabled="chatLoading"
                            @click="onChip(chip.key)"
                        >
                            {{ t(`card.mimiChip.${chip.key}`) }}
                        </button>
                    </div>
                    <div
                        class="flex items-center gap-2 rounded-xl border border-line-strong bg-bg-surface px-3 py-2.5"
                    >
                        <textarea
                            v-model="chatInput"
                            rows="1"
                            class="max-h-28 min-h-[20px] min-w-0 flex-1 resize-none bg-transparent text-[13px] text-cream-faint outline-none placeholder:text-cream-faint"
                            :placeholder="t('deck.aiInputPlaceholder')"
                            :disabled="chatLoading"
                            @keydown.enter="onChatEnterKey"
                        />
                        <button
                            type="button"
                            class="grid size-7 shrink-0 place-items-center rounded-lg bg-brand text-on-color disabled:opacity-40"
                            :disabled="!chatInput.trim() || chatLoading"
                            @click="onChatSend()"
                        >
                            <ArrowRight class="size-3.5" />
                        </button>
                    </div>
                    <p v-if="messagesLeft" class="mt-2 text-center text-[12px] text-cream-faint">
                        {{ messagesLeft }}
                    </p>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { Volume2, Image as ImageIcon, Check, X, ArrowRight } from 'lucide-vue-next';
import { useDecks, useCards, useToast, useT, useApiError } from '#imports';
import { uploadMedia } from '@/api/media';
import * as chatApi from '@/api/chat';
import { useAnalytics } from '@/composables/useAnalytics';
import { useAuthStore } from '@/stores/auth';
import { usePremiumGateStore } from '@/stores/premiumGate';
import { renderMarkdown } from '@/utils/markdown';
import { isRunningLow } from '@/utils/usageHint';
import type { MediaKind } from '@/api/media';
import type { CardDifficulty } from '@/types/deck';

definePageMeta({ layout: 'default' });

const route = useRoute();
const id = computed(() => String(route.params.id));

const { store, fetchOne } = useDecks();
const { addCard } = useCards();
const toast = useToast();
const { t } = useT();
const { apiErrorText } = useApiError();
const analytics = useAnalytics();
const auth = useAuthStore();
const premiumGate = usePremiumGateStore();
const { locale } = useI18n();

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

const previewFlipped = ref(false);

// --- Mimi side chat ---
// A plain conversation with Mimi (examples, synonyms, grammar…). It never fills
// the form — the user decides what goes on the card. Each sent message is one of
// the user's daily Mimi messages.
type ChatMsg = { role: 'mimi' | 'user'; text: string };

const mimiOpen = ref(false);
const chatBodyEl = ref<HTMLElement | null>(null);
const chatMessages = ref<ChatMsg[]>([]);
const chatInput = ref('');
const chatLoading = ref(false);
const chatError = ref('');
const streamingText = ref('');
const conversationId = ref<string | null>(null);
const usage = ref<chatApi.AiUsage | null>(null);
let abort: AbortController | null = null;

const difficultyOptions = computed<{ value: CardDifficulty; label: string }[]>(() => [
    { value: 'easy', label: t('card.diffEasy') },
    { value: 'medium', label: t('card.diffMedium') },
    { value: 'hard', label: t('card.diffHard') },
]);

const deckTitle = computed(() => store.deck?.title ?? t('card.thisDeck'));
const nextNumber = computed(() => (store.deck?.cards.length ?? 0) + 1);
const canSubmit = computed(() => front.value.trim().length > 0 && back.value.trim().length > 0);
const existingWords = computed(() => store.deck?.cards.map((c) => c.word) ?? []);

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

const messagesLeft = computed(() => {
    const m = usage.value?.kinds.message;
    if (!m || !isRunningLow(m)) return '';
    return t('card.mimiMessagesLeft')
        .replace('{n}', String(m.remaining))
        .replace('{cap}', String(m.cap));
});

const refreshUsage = async () => {
    try {
        usage.value = await chatApi.getAiUsage();
    } catch {
        // Only an indicator — the limit itself is enforced server-side.
    }
};

const openMimi = () => {
    mimiOpen.value = true;
    void refreshUsage();
    scrollChat();
};

const showChatError = (e: chatApi.StreamError) => {
    if (e.code === 'AI_BUDGET_EXCEEDED') {
        chatError.value = t('chat.err.AI_BUDGET_EXCEEDED');
        if (!auth.isPremium) {
            const d = (e.details ?? {}) as { capPerDay?: number; kind?: string };
            premiumGate.show('ai_budget', {
                ...(d.capPerDay !== undefined ? { capPerDay: d.capPerDay } : {}),
                ...(d.kind ? { kind: d.kind } : {}),
            });
        }
        return;
    }
    chatError.value = t(`chat.err.${e.code}`, apiErrorText({ code: e.code }, 'chat.err.generic'));
};

// Enter sends; Shift+Enter inserts a newline (multi-line prompts).
const onChatEnterKey = (e: KeyboardEvent) => {
    if (e.shiftKey) return;
    e.preventDefault();
    onChatSend();
};

const chips = [{ key: 'examples' }, { key: 'synonyms' }, { key: 'grammar' }];

// With a word typed on the card the question is sent right away; without one it
// is put in the input for the user to finish.
const onChip = (key: string) => {
    const word = front.value.trim();
    if (word) {
        void onChatSend(t(`card.mimiChipAsk.${key}`).replace('{word}', word));
    } else {
        chatInput.value = t(`card.mimiChipAsk.${key}`)
            .replace('{word}', '')
            .replace(/[“”«»]/g, '');
    }
};

const onChatSend = async (override?: string) => {
    const text = (override ?? chatInput.value).trim();
    if (!text || chatLoading.value) return;
    chatError.value = '';
    chatMessages.value.push({ role: 'user', text });
    if (override === undefined) chatInput.value = '';
    chatLoading.value = true;
    streamingText.value = '';
    chatMessages.value.push({ role: 'mimi', text: '' });
    // The reactive copy from the array — mutating the raw object wouldn't re-render.
    const reply = chatMessages.value[chatMessages.value.length - 1]!;
    scrollChat();

    try {
        if (!conversationId.value) {
            conversationId.value = (await chatApi.createConversation()).id;
        }
        abort = new AbortController();
        await chatApi.streamMessage(
            conversationId.value,
            text,
            {
                onToken: (delta) => {
                    streamingText.value += delta;
                    reply.text = streamingText.value;
                    scrollChat();
                },
                // Text streamed before a tool runs is a throwaway "On it…".
                onToolUse: () => {
                    streamingText.value = '';
                    reply.text = '';
                },
                onToolResult: (e) => {
                    // Mimi added cards to this deck — refresh so the duplicate
                    // hints in the Front field know about them.
                    if (e.ok) fetchOne.execute(id.value);
                },
                onDone: (e) => {
                    reply.text = e.assistantMessage.content;
                },
                onError: (e) => {
                    showChatError(e);
                },
            },
            abort.signal,
            locale.value,
            null,
            { deckId: id.value },
        );
    } catch {
        chatError.value = t('chat.err.generic');
    } finally {
        // An empty reply bubble (error before any text) would just look broken.
        chatMessages.value = chatMessages.value.filter((m) => m.role === 'user' || m.text);
        chatLoading.value = false;
        streamingText.value = '';
        abort = null;
        void refreshUsage();
        scrollChat();
    }
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
    previewFlipped.value = false;
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
        toast.error(apiErrorText(addCard.error.value));
        return false;
    }
    analytics.track('card_added', {
        deck_id: id.value,
        method: 'manual',
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

onBeforeUnmount(() => abort?.abort());
</script>

<style scoped>
.card-field {
    border: 1px solid rgb(var(--c-line) / 0.18);
    border-radius: 14px;
    padding: 12px 16px 14px;
    background: rgb(var(--c-bg-surface));
}

/* Markdown in Mimi's replies (lists of examples, bold words). */
.chat-prose :deep(p) {
    margin: 0;
}
.chat-prose :deep(p + p) {
    margin-top: 0.5rem;
}
.chat-prose :deep(strong) {
    font-weight: 700;
}
.chat-prose :deep(em) {
    font-style: italic;
}
.chat-prose :deep(ul),
.chat-prose :deep(ol) {
    margin: 0.4rem 0;
    padding-left: 1.2rem;
}
.chat-prose :deep(ul) {
    list-style: disc;
}
.chat-prose :deep(ol) {
    list-style: decimal;
}
.chat-prose :deep(li) {
    margin: 0.15rem 0;
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
