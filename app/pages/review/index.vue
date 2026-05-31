<template>
    <section class="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <header>
            <h1 class="font-display text-display-sm text-cream">{{ t('review.title') }}</h1>
            <p class="mt-2 text-body text-cream-dim">{{ t('review.subtitle') }}</p>
        </header>

        <div v-if="srs.loading && !srs.dueCards.length" class="flex justify-center py-12">
            <UiSpinner size="lg" />
        </div>

        <template v-else-if="active && currentDue">
            <div class="flex items-center justify-between text-small text-cream-dim">
                <span>{{ t('review.dueLeft').replace('{n}', String(srs.dueCount)) }}</span>
                <span>{{ t('review.completed').replace('{n}', String(completedCount)) }}</span>
            </div>

            <ReviewCard
                :card="currentDue.card"
                :deck-title="currentDue.deckTitle"
                :flipped="flipped"
                @flip="flipped = !flipped"
                @rate="onRate"
            />
        </template>

        <UiEmptyState
            v-else-if="!active && srs.dueCount === 0"
            :icon="CheckCheck"
            :title="t('review.allCaughtUpTitle')"
            :message="srs.nextReviewAt
                ? t('review.nextReviewAt').replace('{when}', formatNext(srs.nextReviewAt))
                : t('review.noProgressYet')"
        >
            <template #action>
                <UiButton variant="primary" @click="navigateTo('/decks')">
                    {{ t('review.browseDecks') }}
                </UiButton>
            </template>
        </UiEmptyState>

        <UiEmptyState
            v-else
            :icon="Sparkles"
            :title="t('review.readyTitle')"
            :message="t('review.readyMessage').replace('{n}', String(srs.dueCount))"
        >
            <template #action>
                <UiButton variant="primary" @click="startReview">
                    {{ t('review.startReview') }}
                </UiButton>
            </template>
        </UiEmptyState>
    </section>
</template>

<script setup lang="ts">
import { CheckCheck, Sparkles } from 'lucide-vue-next';
import { useSrsStore, useToast, useT } from '#imports';
import type { SrsRating } from '@/types/srs';

definePageMeta({ layout: 'default' });

const srs = useSrsStore();
const toast = useToast();
const { t } = useT();

const active = ref(false);
const flipped = ref(false);
const completedCount = ref(0);

const currentDue = computed(() => srs.dueCards[0] ?? null);

const startReview = () => {
    completedCount.value = 0;
    flipped.value = false;
    active.value = true;
};

const onRate = async (rating: SrsRating) => {
    if (!currentDue.value) return;
    const { card } = currentDue.value;
    flipped.value = false;
    try {
        await srs.rate(card.id, card.deckId, rating);
        completedCount.value++;
        if (srs.dueCount === 0) {
            active.value = false;
            toast.success(t('review.sessionDone'));
        }
    } catch (e) {
        const err = e as { message?: string };
        toast.error(t(err?.message ?? 'review.errors.rate_failed', err?.message ?? 'Could not rate card'));
    }
};

const formatNext = (iso: string) => {
    const d = new Date(iso);
    const diff = d.getTime() - Date.now();
    const hours = Math.round(diff / (60 * 60 * 1000));
    if (hours < 24) return `in ${hours}h`;
    return `in ${Math.round(hours / 24)}d`;
};

onMounted(async () => {
    await srs.fetchAll();
});
</script>
