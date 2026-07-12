<template>
    <div>
        <section
            class="mx-auto max-w-[920px] p-6 transition-[margin] lg:p-8"
            :class="mimiOpen ? 'lg:mr-[340px]' : ''"
        >
            <!-- Heading -->
            <p class="text-[12px] font-semibold uppercase tracking-[.18em] text-cream-faint">
                {{ t('topbar.newDeck') }}
            </p>
            <h1
                class="mb-2 mt-1.5 font-display text-[30px] leading-[1.05] text-cream sm:text-[44px]"
            >
                {{ t('deck.createHeadingPrefix')
                }}<em class="not-italic text-lavender">{{ t('deck.createHeadingAccent') }}</em>
            </h1>
            <p class="mb-8 text-[15px] text-cream-dim">{{ t('deck.createSubtitle') }}</p>

            <!-- Two-column grid (stacks on mobile) -->
            <div class="grid grid-cols-1 gap-7 lg:grid-cols-[1.4fr_1fr]">
                <!-- LEFT -->
                <div class="flex flex-col gap-[18px]">
                    <!-- Deck name -->
                    <div>
                        <p class="flabel">{{ t('deck.title') }}</p>
                        <input
                            v-model="title"
                            class="w-full rounded-xl border border-line-strong dark:bg-[rgba(255,255,255,.03)] bg-bg-well px-3.5 py-3.5 text-[14px] text-cream outline-none placeholder:text-cream-faint focus:border-brand-muted"
                            :placeholder="t('deck.titlePlaceholder')"
                        />
                    </div>

                    <!-- Category picker -->
                    <div>
                        <p class="flabel">{{ t('deck.categoryLabel') }}</p>
                        <div class="flex gap-2.5">
                            <button
                                v-for="cat in DECK_CATEGORIES"
                                :key="cat"
                                type="button"
                                class="flex-1 cursor-pointer rounded-[14px] border p-3.5 text-center text-[14px] font-medium transition-colors"
                                :class="
                                    category === cat
                                        ? 'border-[rgba(242,188,255,.3)] bg-brand text-on-color'
                                        : 'border-line bg-bg-surface text-cream hover:border-line-strong'
                                "
                                @click="category = cat"
                            >
                                {{ t(`deck.category.${cat}`) }}
                            </button>
                        </div>
                    </div>

                    <!-- Description -->
                    <div>
                        <p class="flabel">{{ t('deck.description') }}</p>
                        <textarea
                            v-model="description"
                            class="w-full resize-none rounded-xl border border-line-strong dark:bg-[rgba(255,255,255,.03)] bg-bg-well px-3.5 py-3.5 text-[14px] text-cream outline-none placeholder:text-cream-faint focus:border-brand-muted"
                            style="height: 84px"
                            :placeholder="t('deck.descriptionPlaceholder')"
                        />
                    </div>

                    <!-- Card type tiles -->
                    <div>
                        <p class="flabel">{{ t('deck.cardType') }}</p>
                        <div class="flex gap-2.5">
                            <button
                                v-for="ct in cardTypes"
                                :key="ct.value"
                                type="button"
                                class="flex-1 cursor-pointer rounded-[14px] border p-4 text-left transition-colors"
                                :class="
                                    cardType === ct.value
                                        ? 'border-[rgba(242,188,255,.3)] bg-brand'
                                        : 'border-line bg-bg-surface hover:border-line-strong'
                                "
                                @click="cardType = ct.value"
                            >
                                <p
                                    class="text-[14px] font-bold"
                                    :class="cardType === ct.value ? 'text-on-color' : 'text-cream'"
                                >
                                    {{ ct.label }}
                                </p>
                                <p
                                    class="mt-0.5 text-[12px]"
                                    :class="
                                        cardType === ct.value
                                            ? 'text-on-color/75'
                                            : 'text-cream-dim'
                                    "
                                >
                                    {{ ct.hint }}
                                </p>
                            </button>
                        </div>
                    </div>

                    <!-- Language selects (required for API) -->
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <UiSelect
                                v-model="targetLanguage"
                                :label="t('deck.frontLang')"
                                :options="languageOptions"
                            />
                            <p class="mt-1 text-small text-brand-muted">
                                {{ t('deck.frontLangHint') }} —
                                {{ t('deck.frontLangExample').replace('{lang}', frontLangLabel) }}
                            </p>
                        </div>
                        <div>
                            <UiSelect
                                v-model="sourceLanguage"
                                :label="t('deck.backLang')"
                                :options="languageOptions"
                            />
                            <p class="mt-1 text-small text-brand-muted">
                                {{ t('deck.backLangHint') }} —
                                {{ t('deck.backLangExample').replace('{lang}', backLangLabel) }}
                            </p>
                        </div>
                    </div>

                    <!-- Live preview of which language lands on which side of the card -->
                    <div class="mt-3 rounded-2xl border border-line bg-bg-surface p-3">
                        <p class="mb-2 text-eyebrow uppercase text-brand-muted">
                            {{ t('deck.langPreviewTitle') }}
                        </p>
                        <div class="flex items-center gap-2">
                            <div
                                class="flex-1 rounded-xl border border-line-strong bg-bg-well p-2.5"
                            >
                                <p class="text-[11px] uppercase text-brand-muted">
                                    {{ t('deck.langPreviewFront') }}
                                </p>
                                <p class="mt-0.5 font-display text-sm text-cream">
                                    {{ frontLangLabel }}
                                </p>
                            </div>
                            <ArrowRight class="size-4 shrink-0 text-brand-muted" />
                            <div
                                class="flex-1 rounded-xl border border-line-strong bg-bg-well p-2.5"
                            >
                                <p class="text-[11px] uppercase text-brand-muted">
                                    {{ t('deck.langPreviewBack') }}
                                </p>
                                <p class="mt-0.5 font-display text-sm text-cream">
                                    {{ backLangLabel }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- RIGHT -->
                <div class="flex flex-col gap-[18px]">
                    <!-- Cover swatches -->
                    <div>
                        <p class="flabel">{{ t('deck.cover') }}</p>
                        <div class="flex flex-wrap gap-2.5">
                            <button
                                v-for="(swatch, i) in COVER_SWATCHES"
                                :key="i"
                                type="button"
                                class="flex items-end rounded-[10px] p-1.5 transition-[border-color]"
                                style="width: 50px; height: 64px"
                                :style="{
                                    background: swatch,
                                    border: `2px solid ${coverColor === swatch ? '#F2BCFF' : 'transparent'}`,
                                }"
                                @click="coverColor = swatch"
                            >
                                <Layers class="size-3.5 text-white/70" />
                            </button>
                        </div>
                    </div>

                    <!-- Generate with AI card -->
                    <div
                        class="rounded-[20px] border border-[rgba(169,142,227,.3)] bg-[rgba(169,142,227,.18)] p-[18px]"
                    >
                        <div class="mb-2 flex items-center gap-2.5">
                            <Sparkles class="size-4 text-lavender" />
                            <p class="text-[14px] font-bold text-cream">{{ t('deck.aiTitle') }}</p>
                        </div>
                        <p class="mb-3 text-[13px] leading-[1.5] text-cream-dim">
                            {{ t('deck.aiSubtitle') }}
                        </p>
                        <button
                            type="button"
                            class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-lavender px-[18px] py-3 text-[14px] font-semibold text-lavender transition-colors hover:bg-lavender/10"
                            @click="mimiOpen = true"
                        >
                            {{ t('deck.aiOpenGenerator') }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="mt-8 flex justify-end gap-2.5">
                <UiButton variant="ghost" :disabled="create.loading.value" @click="onCreateEmpty">
                    {{ t('deck.createEmpty') }}
                </UiButton>
                <UiButton
                    variant="primary"
                    :disabled="create.loading.value"
                    @click="onCreateAndAdd"
                >
                    <UiSpinner v-if="create.loading.value" size="sm" class="mr-1" />
                    {{ t('deck.createAndAdd') }} →
                </UiButton>
            </div>
        </section>

        <!-- Docked Mimi chat panel (AI deck generator).
         Mobile: full-screen overlay above the bottom tab bar so the input is reachable.
         Desktop: side panel. -->
        <Transition name="panel-slide">
            <div
                v-if="mimiOpen"
                class="fixed inset-0 z-50 flex w-full flex-col border-line-strong dark:bg-[rgba(13,10,18,.97)] bg-bg-surface md:inset-y-0 md:left-auto md:right-0 md:z-30 md:w-80 md:border-l"
            >
                <!-- Header -->
                <div class="flex items-center justify-between border-b border-line px-5 py-4">
                    <div class="flex items-center gap-2">
                        <SharedMimi :size="32" class="shrink-0" />
                        <p class="font-display text-base text-cream">{{ t('deck.aiTitle') }}</p>
                    </div>
                    <button
                        type="button"
                        class="grid size-8 place-items-center rounded-full text-cream-faint hover:text-cream"
                        @click="mimiOpen = false"
                    >
                        <X class="size-4" />
                    </button>
                </div>

                <!-- Chat body -->
                <div ref="chatBodyEl" class="flex-1 overflow-y-auto p-4">
                    <div
                        v-if="!messages.length && !generating"
                        class="flex flex-col items-center gap-3 py-8 text-center"
                    >
                        <SharedMimi :size="56" />
                        <p class="text-small text-cream-dim">{{ t('deck.aiGreeting') }}</p>
                    </div>

                    <div v-else class="flex flex-col gap-3">
                        <template v-for="(msg, i) in messages" :key="i">
                            <div v-if="msg.role === 'user'" class="flex justify-end">
                                <div
                                    class="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand px-3 py-2 text-small text-on-color"
                                >
                                    {{ msg.text }}
                                </div>
                            </div>

                            <div v-else-if="msg.role === 'mimi'" class="flex items-start gap-2">
                                <SharedMimi :size="24" class="mt-0.5 shrink-0" />
                                <div
                                    class="max-w-[85%] rounded-2xl rounded-tl-sm bg-bg-surface-2 px-3 py-2 text-small text-cream-dim"
                                >
                                    {{ msg.text }}
                                </div>
                            </div>

                            <div
                                v-else-if="msg.role === 'draft'"
                                class="rounded-2xl border border-line bg-bg-surface-2 p-4"
                            >
                                <div class="mb-1 flex items-start justify-between gap-2">
                                    <p
                                        class="font-display text-sm font-medium leading-snug text-cream"
                                    >
                                        {{ msg.data.title }}
                                    </p>
                                    <span
                                        class="shrink-0 text-[11px] uppercase tracking-wide text-cream-faint"
                                    >
                                        {{ msg.data.targetLanguage }}→{{ msg.data.sourceLanguage }}
                                    </span>
                                </div>
                                <p class="mb-3 text-[11px] text-cream-faint">
                                    {{
                                        t('deck.cardCount').replace(
                                            '{n}',
                                            String(msg.data.cards.length),
                                        )
                                    }}
                                </p>
                                <ul class="mb-3 flex flex-col gap-1">
                                    <li
                                        v-for="(c, ci) in msg.data.cards.slice(0, 4)"
                                        :key="ci"
                                        class="flex justify-between gap-2 text-small"
                                    >
                                        <span class="font-medium text-cream">{{ c.word }}</span>
                                        <span class="truncate text-cream-dim">{{
                                            c.definition
                                        }}</span>
                                    </li>
                                </ul>
                                <p
                                    v-if="msg.data.cards.length > 4"
                                    class="mb-3 text-[11px] text-cream-faint"
                                >
                                    {{
                                        t('deck.aiMore').replace(
                                            '{n}',
                                            String(msg.data.cards.length - 4),
                                        )
                                    }}
                                </p>
                                <div class="flex gap-2">
                                    <UiButton
                                        variant="ghost"
                                        class="flex-1 !py-1.5 !text-small"
                                        :disabled="accepting"
                                        @click="onDiscard(msg)"
                                    >
                                        {{ t('deck.aiDiscard') }}
                                    </UiButton>
                                    <UiButton
                                        variant="primary"
                                        class="flex-1 !py-1.5 !text-small"
                                        :disabled="accepting"
                                        @click="onAccept(msg.data)"
                                    >
                                        <UiSpinner v-if="accepting" size="sm" class="mr-1" />
                                        {{ t('deck.aiCreate') }}
                                    </UiButton>
                                </div>
                            </div>
                        </template>

                        <div v-if="generating" class="flex items-center gap-2">
                            <SharedMimi :size="24" class="mt-0.5 shrink-0" />
                            <div
                                class="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-bg-surface-2 px-3 py-3 text-cream-faint"
                            >
                                <span class="mimi-dot" />
                                <span class="mimi-dot" />
                                <span class="mimi-dot" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick pills (after first generation) -->
                <div
                    v-if="lastTopic && !generating"
                    class="flex flex-wrap gap-1.5 border-t border-line px-4 py-2.5"
                >
                    <button
                        class="rounded-full border border-line px-2.5 py-1 text-[12px] text-cream-dim transition-colors hover:border-line-strong hover:text-cream"
                        @click="onQuickPill('more')"
                    >
                        {{ t('deck.aiPillMore') }}
                    </button>
                    <button
                        class="rounded-full border border-line px-2.5 py-1 text-[12px] text-cream-dim transition-colors hover:border-line-strong hover:text-cream"
                        @click="onQuickPill('harder')"
                    >
                        {{ t('deck.aiPillHarder') }}
                    </button>
                    <button
                        class="rounded-full border border-line px-2.5 py-1 text-[12px] text-cream-dim transition-colors hover:border-line-strong hover:text-cream"
                        @click="onQuickPill('examples')"
                    >
                        {{ t('deck.aiPillExamples') }}
                    </button>
                </div>

                <!-- Footer: input -->
                <div class="border-t border-line p-3">
                    <div class="flex gap-2">
                        <textarea
                            v-model="chatInput"
                            rows="1"
                            class="max-h-32 min-h-[38px] min-w-0 flex-1 resize-none rounded-xl border border-line bg-bg-surface-2 px-3 py-2 text-small text-cream placeholder:text-cream-faint focus:outline-none focus:ring-1 focus:ring-lavender/40 disabled:opacity-50"
                            :placeholder="t('deck.aiInputPlaceholder')"
                            :disabled="generating"
                            @keydown.enter="onEnterKey"
                        />
                        <button
                            type="button"
                            class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-on-color transition-opacity disabled:opacity-40"
                            :disabled="!chatInput.trim() || generating"
                            @click="onSend"
                        >
                            <ArrowUp class="size-4" />
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Mobile backdrop -->
        <div v-if="mimiOpen" class="fixed inset-0 z-10 lg:hidden" @click="mimiOpen = false" />
    </div>
</template>

<script setup lang="ts">
import { Sparkles, Layers, X, ArrowUp, ArrowRight } from 'lucide-vue-next';
import { useDecks, useToast, useT } from '#imports';
import * as aiApi from '@/api/ai';
import type { AiDeckDraft } from '@/api/ai';
import { bulkAddCards } from '@/api/cards';
import { useAnalytics } from '@/composables/useAnalytics';
import { useDecksStore } from '@/stores/decks';
import { LANGUAGES } from '@/schemas/deck';
import type { DeckInput } from '@/types/deck';
import { DECK_CATEGORIES, normCategory } from '@/utils/deckCategories';
import type { DeckCategory } from '@/utils/deckCategories';

definePageMeta({ layout: 'default' });

type UserMsg = { role: 'user'; text: string };
type MimiMsg = { role: 'mimi'; text: string };
type DraftMsg = { role: 'draft'; data: AiDeckDraft };
type ChatMsg = UserMsg | MimiMsg | DraftMsg;

const COVER_SWATCHES = [
    '#7C5CBF',
    '#4A7FBD',
    '#C2447A',
    '#2A9D8F',
    '#D4845A',
    '#C45C5C',
    '#3A9E6F',
    '#5B6BBF',
];

const { create } = useDecks();
const toast = useToast();
const { t } = useT();
const analytics = useAnalytics();
const decksStore = useDecksStore();

// Best-effort: true when the library has no decks yet at create time.
const isFirstDeck = () => decksStore.summaries.length === 0;

useSeo({ title: t('seo.deckCreateTitle'), description: t('seo.appDesc'), noindex: true });

// Form state
const title = ref('');
const category = ref<DeckCategory>('other');
const description = ref('');
const sourceLanguage = ref('en');
const targetLanguage = ref('es');
const cardType = ref<'basic' | 'cloze' | 'image'>('basic');
const coverColor = ref(COVER_SWATCHES[0]);

const languageOptions = LANGUAGES.map((l) => ({ value: l.code, label: l.label }));

const labelForLang = (code: string) =>
    LANGUAGES.find((l) => l.code === code)?.label ?? code.toUpperCase();
const frontLangLabel = computed(() => labelForLang(targetLanguage.value));
const backLangLabel = computed(() => labelForLang(sourceLanguage.value));

const cardTypes = computed(() => [
    { value: 'basic', label: t('deck.cardTypeBasic'), hint: t('deck.cardTypeBasicHint') },
    { value: 'cloze', label: t('deck.cardTypeCloze'), hint: t('deck.cardTypeClozeHint') },
    { value: 'image', label: t('deck.cardTypeImage'), hint: t('deck.cardTypeImageHint') },
]);

// Chat / panel state
const mimiOpen = ref(false);
const chatBodyEl = ref<HTMLElement | null>(null);
const messages = ref<ChatMsg[]>([]);
const chatInput = ref('');
const generating = ref(false);
const accepting = ref(false);
const aiSource = ref('en');
const aiTarget = ref('es');
const aiCount = ref(12);
const lastTopic = ref('');

const scrollToBottom = () => {
    nextTick(() => {
        if (chatBodyEl.value) chatBodyEl.value.scrollTop = chatBodyEl.value.scrollHeight;
    });
};

const buildInput = (): DeckInput => ({
    title: title.value.trim(),
    description: description.value.trim() || null,
    sourceLanguage: sourceLanguage.value,
    targetLanguage: targetLanguage.value,
    // All decks are public — anyone can discover and copy them.
    isPublic: true,
    coverColor: coverColor.value,
    subject: category.value,
});

const validate = (): boolean => {
    if (!title.value.trim()) {
        toast.error(t('deck.errors.title_too_short'));
        return false;
    }
    if (sourceLanguage.value === targetLanguage.value) {
        toast.error(t('deck.errors.languages_same'));
        return false;
    }
    return true;
};

const trackDeckCreated = (deckId: string, source: 'manual' | 'ai_generated', cards: number) =>
    analytics.track('deck_created', {
        deck_id: deckId,
        creation_source: source,
        card_count: cards,
        source_language: sourceLanguage.value,
        target_language: targetLanguage.value,
        is_first_deck: isFirstDeck(),
        is_public: true,
    });

const onCreateEmpty = async () => {
    if (!validate()) return;
    const deck = await create.execute(buildInput());
    if (deck) {
        trackDeckCreated(deck.id, 'manual', 0);
        toast.success(t('deck.created'));
        await navigateTo(`/decks/${deck.id}`);
    }
};

const onCreateAndAdd = async () => {
    if (!validate()) return;
    const deck = await create.execute(buildInput());
    if (deck) {
        trackDeckCreated(deck.id, 'manual', 0);
        toast.success(t('deck.created'));
        await navigateTo(`/decks/${deck.id}/cards/add`);
    }
};

const generate = async (topic: string) => {
    lastTopic.value = topic;
    generating.value = true;
    scrollToBottom();
    const startedAt = Date.now();
    analytics.track('ai_feature_started', { ai_feature: 'generate_deck', context: 'create_deck' });
    try {
        const res = await aiApi.generateDeck({
            topic,
            sourceLanguage: aiSource.value,
            targetLanguage: aiTarget.value,
            count: aiCount.value,
        });
        messages.value.push({ role: 'draft', data: res.draft });
        analytics.track('ai_feature_completed', {
            ai_feature: 'generate_deck',
            context: 'create_deck',
            result_size: res.draft.cards.length,
            duration_ms: Date.now() - startedAt,
        });
    } catch {
        messages.value.push({ role: 'mimi', text: t('deck.aiGenerateError') });
    } finally {
        generating.value = false;
        scrollToBottom();
    }
};

// Enter sends; Shift+Enter inserts a newline (multi-line prompts).
const onEnterKey = (e: KeyboardEvent) => {
    if (e.shiftKey) return;
    e.preventDefault();
    onSend();
};

const onSend = async () => {
    const text = chatInput.value.trim();
    if (!text || generating.value) return;
    messages.value.push({ role: 'user', text });
    chatInput.value = '';
    await generate(text);
};

const onQuickPill = async (pill: 'more' | 'harder' | 'examples') => {
    const labels: Record<string, string> = {
        more: t('deck.aiPillMore'),
        harder: t('deck.aiPillHarder'),
        examples: t('deck.aiPillExamples'),
    };
    messages.value.push({ role: 'user', text: labels[pill]! });
    if (pill === 'more') {
        aiCount.value = Math.min(aiCount.value + 4, 20);
        await generate(lastTopic.value);
    } else if (pill === 'harder') {
        await generate(`${lastTopic.value} (advanced level)`);
    } else {
        await generate(`${lastTopic.value} (with example sentences)`);
    }
};

const onDiscard = (msg: ChatMsg) => {
    messages.value = messages.value.filter((m) => m !== msg);
};

const onAccept = async (d: AiDeckDraft) => {
    accepting.value = true;
    try {
        const deck = await create.execute({
            title: d.title,
            description: d.description,
            sourceLanguage: d.sourceLanguage,
            targetLanguage: d.targetLanguage,
            subject: normCategory(d.subject),
            glyph: d.glyph ?? null,
        });
        if (!deck) throw new Error('create failed');
        await bulkAddCards(
            deck.id,
            d.cards.map((c) => ({
                word: c.word,
                definition: c.definition,
                phonetic: c.phonetic ?? null,
                partOfSpeech: c.partOfSpeech,
                example: c.example,
                exampleTranslation: c.exampleTranslation,
                tags: c.tags,
                difficulty: c.difficulty,
            })),
        );
        analytics.track('deck_created', {
            deck_id: deck.id,
            creation_source: 'ai_generated',
            card_count: d.cards.length,
            source_language: d.sourceLanguage,
            target_language: d.targetLanguage,
            is_first_deck: isFirstDeck(),
            is_public: false,
        });
        toast.success(t('deck.aiCreated'));
        await navigateTo(`/decks/${deck.id}`);
    } catch {
        toast.error(t('deck.aiCreateError'));
    } finally {
        accepting.value = false;
    }
};
</script>

<style scoped>
.flabel {
    font-size: 11px;
    color: rgb(var(--c-cream) / 0.42);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 8px;
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
