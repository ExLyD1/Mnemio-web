<template>
    <StudyModePicker :key="String(route.query.pick)" :deck-id="deckId" />
</template>
<script setup lang="ts">
const route = useRoute();
const deckId = computed(() => String(route.params.deckId));
const { t } = useT();
definePageMeta({ layout: 'study' });
useSeo({ title: t('seo.studyTitle'), description: t('seo.appDesc'), noindex: true });
</script>
