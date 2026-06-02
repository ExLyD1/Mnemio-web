<template>
    <section class="mx-auto flex max-w-2xl flex-col gap-6 p-8">
        <NuxtLink
            to="/decks"
            class="flex w-fit items-center gap-1 text-small text-brand-muted transition-colors hover:text-brand-pale"
        >
            <ArrowLeft class="size-4" /> My Decks
        </NuxtLink>

        <div>
            <p class="text-eyebrow uppercase text-brand-muted">New deck</p>
            <h1 class="mt-1 font-display text-display-sm text-cream">Create a new deck.</h1>
            <p class="mt-2 text-body text-cream-dim">
                Name it, pick the languages, and start adding cards.
            </p>
        </div>

        <div class="rounded-[20px] border border-line bg-bg-surface p-6">
            <DeckForm
                :loading="create.loading.value"
                submit-label="Create & add cards"
                @submit="onSubmit"
                @cancel="navigateTo('/decks')"
            />
        </div>

        <div class="flex items-center gap-3 text-small text-brand-muted">
            <span class="h-px flex-1 bg-line" />
            OR
            <span class="h-px flex-1 bg-line" />
        </div>

        <UiTooltip content="AI generation coming soon" side="top">
            <button
                type="button"
                disabled
                class="flex w-full items-center gap-3 rounded-2xl border border-line-strong bg-brand/15 p-4 text-left opacity-60"
            >
                <Sparkles class="size-6 shrink-0 text-lavender" />
                <span>
                    <span class="block text-body font-semibold text-cream">Generate with AI</span>
                    <span class="block text-small text-brand-muted">
                        Describe a topic and let Mimi draft a starter deck.
                    </span>
                </span>
            </button>
        </UiTooltip>
    </section>
</template>

<script setup lang="ts">
import { ArrowLeft, Sparkles } from 'lucide-vue-next';
import { useDecks, useToast, useT } from '#imports';

definePageMeta({ layout: 'default' });

const { create } = useDecks();
const toast = useToast();
const { t } = useT();

const onSubmit = async (payload: {
    title: string;
    description: string | null;
    sourceLanguage: string;
    targetLanguage: string;
}) => {
    const result = await create.execute(payload);
    if (result) {
        toast.success(t('deck.created'));
        await navigateTo(`/decks/${result.id}/cards/add`);
    } else if (create.error.value) {
        toast.error(t(create.error.value.message, create.error.value.message));
    }
};
</script>
