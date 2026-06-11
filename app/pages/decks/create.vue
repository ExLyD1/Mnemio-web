<template>
    <section class="mx-auto flex max-w-2xl flex-col gap-6 p-8">
        <NuxtLink
            to="/decks"
            class="flex w-fit items-center gap-1 text-small text-brand-muted transition-colors hover:text-brand-pale"
        >
            <ArrowLeft class="size-4" /> {{ t('deck.myDecks') }}
        </NuxtLink>

        <div>
            <p class="text-eyebrow uppercase text-brand-muted">{{ t('topbar.newDeck') }}</p>
            <h1 class="mt-1 font-display text-display-sm text-cream">
                {{ t('deck.createHeading') }}
            </h1>
            <p class="mt-2 text-body text-cream-dim">
                {{ t('deck.createSubtitle') }}
            </p>
        </div>

        <div class="rounded-[20px] border border-line bg-bg-surface p-6">
            <DeckForm
                :loading="create.loading.value"
                :submit-label="t('deck.createAndAdd')"
                @submit="onSubmit"
                @cancel="navigateTo('/decks')"
            />
        </div>

        <div class="flex items-center gap-3 text-small text-brand-muted">
            <span class="h-px flex-1 bg-line" />
            {{ t('common.or') }}
            <span class="h-px flex-1 bg-line" />
        </div>

        <!-- AI generation -->
        <div class="rounded-2xl border border-line-strong bg-brand/15 p-5">
            <div class="flex items-start gap-3">
                <Sparkles class="size-6 shrink-0 text-lavender" />
                <div class="flex-1">
                    <p class="text-body font-semibold text-cream">{{ t('deck.aiTitle') }}</p>
                    <p class="text-small text-brand-muted">
                        {{ t('deck.aiSubtitle') }}
                    </p>
                </div>
            </div>

            <div v-if="!draft" class="mt-4 flex flex-col gap-3">
                <UiInputField
                    v-model="topic"
                    :label="t('deck.aiTopic')"
                    :placeholder="t('deck.aiTopicPlaceholder')"
                />
                <div class="grid gap-3 sm:grid-cols-2">
                    <UiSelect
                        v-model="aiTarget"
                        :label="t('deck.frontLang')"
                        :options="languageOptions"
                    />
                    <UiSelect
                        v-model="aiSource"
                        :label="t('deck.backLang')"
                        :options="languageOptions"
                    />
                </div>
                <UiSelect
                    v-model="aiCount"
                    :label="t('deck.aiCount')"
                    :options="countOptions"
                    class="sm:max-w-[12rem]"
                />
                <UiButton
                    variant="primary"
                    class="self-start"
                    :disabled="!topic.trim() || generating"
                    @click="onGenerate"
                >
                    <UiSpinner v-if="generating" size="sm" class="mr-2" />
                    {{ t('deck.aiGenerate') }}
                </UiButton>
            </div>

            <div v-else class="mt-4 flex flex-col gap-3">
                <UiInputField v-model="draft.title" :label="t('ai.titleLabel')" />
                <div class="rounded-xl border border-line bg-bg-surface p-4">
                    <p class="text-small text-brand-muted">{{ draft.description }}</p>
                    <p class="mt-2 text-small text-brand-pale">
                        {{ t('deck.cardCount').replace('{n}', String(draft.cards.length)) }}
                    </p>
                    <ul class="mt-2 flex flex-col gap-1">
                        <li
                            v-for="(c, i) in draft.cards.slice(0, 6)"
                            :key="i"
                            class="flex justify-between gap-3 text-small text-cream-dim"
                        >
                            <span class="font-medium text-cream">{{ c.word }}</span>
                            <span class="truncate">{{ c.definition }}</span>
                        </li>
                    </ul>
                    <p v-if="draft.cards.length > 6" class="mt-1 text-small text-brand-muted">
                        {{ t('deck.aiMore').replace('{n}', String(draft.cards.length - 6)) }}
                    </p>
                </div>
                <div class="flex gap-2">
                    <UiButton variant="ghost" :disabled="accepting" @click="draft = null">
                        {{ t('deck.aiDiscard') }}
                    </UiButton>
                    <UiButton variant="primary" :disabled="accepting" @click="onAccept">
                        <UiSpinner v-if="accepting" size="sm" class="mr-2" />
                        {{ t('deck.aiCreate') }}
                    </UiButton>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ArrowLeft, Sparkles } from 'lucide-vue-next';
import { useDecks, useToast, useT } from '#imports';
import * as aiApi from '@/api/ai';
import type { AiDeckDraft } from '@/api/ai';
import { bulkAddCards } from '@/api/cards';
import { LANGUAGES } from '@/schemas/deck';

definePageMeta({ layout: 'default' });

const { create } = useDecks();
const toast = useToast();
const { t } = useT();

useSeo({ title: t('seo.deckCreateTitle'), description: t('seo.appDesc'), noindex: true });

const languageOptions = LANGUAGES.map((l) => ({ value: l.code, label: l.label }));

const topic = ref('');
const aiSource = ref('en');
const aiTarget = ref('es');
const aiCount = ref('12');
const generating = ref(false);
const accepting = ref(false);
const draft = ref<AiDeckDraft | null>(null);

// Backend caps generate-deck at 20 words (see ai.schema.ts) — keep options ≤ 20.
const countOptions = ['8', '12', '16', '20'].map((n) => ({ value: n, label: n }));

const onSubmit = async (payload: {
    title: string;
    description: string | null;
    sourceLanguage: string;
    targetLanguage: string;
    isPublic: boolean;
}) => {
    const result = await create.execute(payload);
    if (result) {
        toast.success(t('deck.created'));
        await navigateTo(`/decks/${result.id}/cards/add`);
    } else if (create.error.value) {
        toast.error(t(create.error.value.message, create.error.value.message));
    }
};

const onGenerate = async () => {
    if (!topic.value.trim()) {
        return;
    }
    generating.value = true;
    try {
        const res = await aiApi.generateDeck({
            topic: topic.value.trim(),
            sourceLanguage: aiSource.value,
            targetLanguage: aiTarget.value,
            count: Number(aiCount.value),
        });
        draft.value = res.draft;
    } catch {
        toast.error(t('deck.aiGenerateError'));
    } finally {
        generating.value = false;
    }
};

const onAccept = async () => {
    const d = draft.value;
    if (!d) {
        return;
    }
    accepting.value = true;
    try {
        const deck = await create.execute({
            title: d.title,
            description: d.description,
            sourceLanguage: d.sourceLanguage,
            targetLanguage: d.targetLanguage,
            subject: d.subject ?? null,
            glyph: d.glyph ?? null,
        });
        if (!deck) {
            throw new Error('create failed');
        }
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
        toast.success(t('deck.aiCreated'));
        await navigateTo(`/decks/${deck.id}`);
    } catch {
        toast.error(t('deck.aiCreateError'));
    } finally {
        accepting.value = false;
    }
};
</script>
