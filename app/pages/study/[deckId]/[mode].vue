<template>
    <StudySession
        :key="route.fullPath"
        :deck-id="deckId"
        :mode="practiceMode"
        :format="format"
        :resume="route.query.resume === '1'"
    />
</template>
<script setup lang="ts">
import { resolvePracticeMode } from '@/composables/usePracticePreferences';
const route = useRoute();
const deckId = computed(() => String(route.params.deckId));
const practiceMode = computed(() => resolvePracticeMode(route.query));
const format = computed(() =>
    route.params.mode === 'multiple-choice' ? 'multiple-choice' : 'flashcard',
);
const { t } = useT();
definePageMeta({ layout: 'study' });
useSeo({ title: t('seo.studyTitle'), description: t('seo.appDesc'), noindex: true });
</script>
