<template>
    <section class="mx-auto flex max-w-3xl flex-col gap-6 p-8">
        <header>
            <p class="text-eyebrow uppercase text-brand-muted">{{ t('aiPage.title') }}</p>
            <h1 class="mt-1 font-display text-display-sm text-cream">{{ t('aiPage.title') }}</h1>
            <p class="mt-2 text-body text-cream-dim">{{ t('aiPage.subtitle') }}</p>
        </header>

        <!-- Conversation thread -->
        <div class="flex flex-col gap-4">
            <div
                v-for="(m, i) in messages"
                :key="i"
                class="flex gap-3"
                :class="m.role === 'user' ? 'flex-row-reverse' : ''"
            >
                <SharedMimi v-if="m.role === 'assistant'" :size="40" class="shrink-0" />

                <div
                    v-if="m.kind === 'text'"
                    class="max-w-[80%] rounded-2xl px-4 py-2.5 text-body"
                    :class="
                        m.role === 'user'
                            ? 'bg-brand text-on-color'
                            : 'border border-line bg-bg-surface text-cream'
                    "
                >
                    {{ m.text }}
                </div>

                <!-- Draft result card -->
                <div v-else class="min-w-0 flex-1 rounded-2xl border border-line bg-bg-surface p-4">
                    <p class="break-words font-display text-h3 text-cream">{{ m.draft.title }}</p>
                    <p class="mt-1 text-small text-brand-muted">{{ m.draft.description }}</p>
                    <ul class="mt-3 flex flex-col gap-1">
                        <li
                            v-for="(c, ci) in m.draft.cards.slice(0, 6)"
                            :key="ci"
                            class="flex justify-between gap-3 text-small text-cream-dim"
                        >
                            <span class="min-w-0 truncate font-medium text-cream">{{
                                c.word
                            }}</span>
                            <span class="min-w-0 truncate text-right">{{ c.definition }}</span>
                        </li>
                    </ul>
                    <p v-if="m.draft.cards.length > 6" class="mt-1 text-small text-brand-muted">
                        {{ t('deck.aiMore').replace('{n}', String(m.draft.cards.length - 6)) }}
                    </p>
                    <UiButton
                        variant="primary"
                        class="mt-4"
                        :disabled="creatingIndex === i"
                        @click="createFromDraft(m.draft, i)"
                    >
                        <UiSpinner v-if="creatingIndex === i" size="sm" class="mr-2" />
                        {{ t('aiPage.createDeck') }}
                    </UiButton>
                </div>
            </div>

            <div v-if="generating" class="flex gap-3">
                <SharedMimi :size="40" class="shrink-0" />
                <div
                    class="flex items-center gap-2 rounded-2xl border border-line bg-bg-surface px-4 py-2.5 text-body text-brand-muted"
                >
                    <UiSpinner size="sm" /> {{ t('aiPage.thinking') }}
                </div>
            </div>
        </div>

        <!-- Composer -->
        <div
            class="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-line-strong bg-bg-surface p-3 shadow-soft-elevation"
        >
            <div class="flex gap-2">
                <button
                    v-for="opt in modeOptions"
                    :key="opt.value"
                    type="button"
                    class="rounded-full px-3 py-1.5 text-small transition-colors"
                    :class="
                        mode === opt.value
                            ? 'bg-brand text-on-color'
                            : 'text-brand-muted hover:bg-brand/20'
                    "
                    @click="mode = opt.value"
                >
                    {{ opt.label }}
                </button>
            </div>

            <template v-if="mode === 'generate'">
                <UiInputField
                    v-model="topic"
                    :label="t('deck.aiTopic')"
                    :placeholder="t('deck.aiTopicPlaceholder')"
                    @keydown.enter="onGenerate"
                />
                <div class="flex flex-wrap items-end gap-2">
                    <UiSelect
                        v-model="target"
                        :label="t('deck.frontLang')"
                        :options="languageOptions"
                        class="flex-1"
                    />
                    <UiSelect
                        v-model="source"
                        :label="t('deck.backLang')"
                        :options="languageOptions"
                        class="flex-1"
                    />
                    <UiSelect
                        v-model="count"
                        :label="t('deck.aiCount')"
                        :options="countOptions"
                        class="w-24"
                    />
                    <UiButton
                        variant="primary"
                        :disabled="!topic.trim() || generating"
                        @click="onGenerate"
                    >
                        {{ t('aiPage.send') }}
                    </UiButton>
                </div>
            </template>

            <template v-else>
                <p class="text-small text-brand-muted">{{ t('aiPage.defineHint') }}</p>
                <UiButton variant="primary" class="self-start" @click="importOpen = true">
                    <Sparkles class="size-4" /> {{ t('aiPage.openImporter') }}
                </UiButton>
            </template>
        </div>

        <AiImportDialog v-model="importOpen" />
    </section>
</template>

<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next';
import { useDecks, useToast, useT } from '#imports';
import * as aiApi from '@/api/ai';
import type { AiDeckDraft } from '@/api/ai';
import { bulkAddCards } from '@/api/cards';
import { LANGUAGES } from '@/schemas/deck';

definePageMeta({ layout: 'default' });

type AiMessage =
    | { role: 'assistant' | 'user'; kind: 'text'; text: string }
    | { role: 'assistant'; kind: 'draft'; draft: AiDeckDraft };

const { create } = useDecks();
const toast = useToast();
const { t } = useT();

const languageOptions = LANGUAGES.map((l) => ({ value: l.code, label: l.label }));
const countOptions = ['8', '12', '16', '20'].map((n) => ({ value: n, label: n }));
const modeOptions = computed(() => [
    { value: 'generate' as const, label: t('aiPage.modeGenerate') },
    { value: 'define' as const, label: t('aiPage.modeDefine') },
]);

const messages = ref<AiMessage[]>([
    { role: 'assistant', kind: 'text', text: t('aiPage.greeting') },
]);
const mode = ref<'generate' | 'define'>('generate');
const topic = ref('');
const source = ref('en');
const target = ref('es');
const count = ref('12');
const generating = ref(false);
const creatingIndex = ref<number | null>(null);
const importOpen = ref(false);

const onGenerate = async () => {
    const value = topic.value.trim();
    if (!value) {
        return;
    }
    messages.value.push({
        role: 'user',
        kind: 'text',
        text: t('aiPage.userGenerate').replace('{topic}', value),
    });
    topic.value = '';
    generating.value = true;
    try {
        const res = await aiApi.generateDeck({
            topic: value,
            sourceLanguage: source.value,
            targetLanguage: target.value,
            count: Number(count.value),
        });
        messages.value.push({
            role: 'assistant',
            kind: 'text',
            text: t('aiPage.draftReady')
                .replace('{topic}', value)
                .replace('{n}', String(res.draft.cards.length)),
        });
        messages.value.push({ role: 'assistant', kind: 'draft', draft: res.draft });
    } catch {
        messages.value.push({ role: 'assistant', kind: 'text', text: t('aiPage.error') });
    } finally {
        generating.value = false;
    }
};

const createFromDraft = async (draft: AiDeckDraft, index: number) => {
    creatingIndex.value = index;
    try {
        const deck = await create.execute({
            title: draft.title,
            description: draft.description,
            sourceLanguage: draft.sourceLanguage,
            targetLanguage: draft.targetLanguage,
            subject: draft.subject ?? null,
            glyph: draft.glyph ?? null,
        });
        if (!deck) {
            throw new Error('create failed');
        }
        await bulkAddCards(
            deck.id,
            draft.cards.map((c) => ({
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
        toast.success(t('aiPage.created'));
        await navigateTo(`/decks/${deck.id}`);
    } catch {
        toast.error(t('aiPage.error'));
    } finally {
        creatingIndex.value = null;
    }
};
</script>
