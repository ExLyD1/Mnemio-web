<template>
    <section class="mx-auto flex max-w-3xl flex-col gap-6 p-6">
        <UiEmptyState
            v-if="!result"
            :title="t('study.noResultsTitle')"
            :message="t('study.noResultsMessage')"
        >
            <template #action>
                <UiButton variant="primary" @click="navigateTo(`/decks/${deckId}`)">
                    {{ t('study.backToDeck') }}
                </UiButton>
            </template>
        </UiEmptyState>

        <StudyResultsSummary
            v-else
            :correct="result.correct"
            :total="result.cardIds.length"
            :xp="result.xpAwarded"
            @study-again="navigateTo(`/study/${deckId}`)"
            @back-to-deck="navigateTo(`/decks/${deckId}`)"
        />
    </section>
</template>

<script setup lang="ts">
import { useSessionsStore, useT } from '#imports';

definePageMeta({ layout: 'default' });

const route = useRoute();
const deckId = computed(() => String(route.params.deckId));

const sessions = useSessionsStore();
const { t } = useT();

const result = computed(() => sessions.lastCompleted);
</script>
