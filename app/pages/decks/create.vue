<template>
    <section class="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <header class="flex items-center gap-3">
            <button
                type="button"
                class="rounded-md p-1.5 text-brand-muted transition-colors hover:bg-bg-muted hover:text-brand-pale"
                :aria-label="t('common.back')"
                @click="navigateTo('/decks')"
            >
                <ArrowLeft class="size-5" />
            </button>
            <h1 class="text-h1 font-bold text-neutral-0">{{ t('deck.createTitle') }}</h1>
        </header>

        <div class="rounded-2xl bg-bg-surface p-6">
            <DeckForm
                :loading="create.loading.value"
                :submit-label="t('deck.create')"
                @submit="onSubmit"
                @cancel="navigateTo('/decks')"
            />
        </div>
    </section>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
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
        await navigateTo(`/decks/${result.id}`);
    } else if (create.error.value) {
        toast.error(t(create.error.value.message, create.error.value.message));
    }
};
</script>
