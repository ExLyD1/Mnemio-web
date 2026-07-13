<template>
    <section class="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        <header class="flex items-center gap-3">
            <button
                type="button"
                class="rounded-md p-1.5 text-brand-muted transition-colors hover:bg-bg-muted hover:text-brand-pale"
                :aria-label="t('common.back')"
                @click="goBack"
            >
                <ArrowLeft class="size-5" />
            </button>
            <h1 class="text-h1 font-bold text-cream">{{ t('deck.editTitle') }}</h1>
        </header>

        <SharedPageLoader v-if="fetchOne.loading.value && !store.deck" />

        <div v-else-if="store.deck" class="rounded-2xl bg-bg-surface p-6">
            <DeckForm
                :initial="{
                    title: store.deck.title,
                    description: store.deck.description,
                    sourceLanguage: store.deck.sourceLanguage,
                    targetLanguage: store.deck.targetLanguage,
                    isPublic: store.deck.isPublic,
                }"
                :loading="update.loading.value"
                :submit-label="t('common.save')"
                @submit="onSubmit"
                @cancel="goBack"
            />
        </div>

        <UiEmptyState v-else :title="t('deck.notFoundTitle')" :message="t('deck.notFoundMessage')">
            <template #action>
                <UiButton variant="primary" @click="navigateTo('/decks')">
                    {{ t('deck.backToDecks') }}
                </UiButton>
            </template>
        </UiEmptyState>
    </section>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next';
import { useDecks, useToast, useT } from '#imports';

definePageMeta({ layout: 'default' });

const route = useRoute();
const deckId = computed(() => String(route.params.id));

const { store, fetchOne, update } = useDecks();
const toast = useToast();
const { t } = useT();

useSeo({ title: t('seo.deckEditTitle'), description: t('seo.appDesc'), noindex: true });

const goBack = () => navigateTo(`/decks/${deckId.value}`);

const onSubmit = async (payload: {
    title: string;
    description: string | null;
    sourceLanguage: string;
    targetLanguage: string;
    isPublic: boolean;
}) => {
    const result = await update.execute(deckId.value, payload);
    if (result) {
        toast.success(t('deck.updated'));
        await navigateTo(`/decks/${deckId.value}`);
    } else if (update.error.value) {
        toast.error(t(update.error.value.message, update.error.value.message));
    }
};

onMounted(() => {
    if (!store.deck || store.deck.id !== deckId.value) {
        fetchOne.execute(deckId.value);
    }
});
</script>
