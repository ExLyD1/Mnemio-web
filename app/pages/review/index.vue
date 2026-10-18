<template>
    <StudySession
        v-if="selectedMode"
        :key="route.fullPath"
        :mode="selectedMode"
        format="flashcard"
    />
    <StudyModePicker v-else :key="String(route.query.pick)" />
</template>
<script setup lang="ts">
const route = useRoute();
const selectedMode = computed(() =>
    route.query.pick === '1'
        ? null
        : route.query.mode === 'know'
          ? 'know'
          : route.query.mode === 'srs'
            ? 'srs'
            : null,
);
const { t } = useT();
definePageMeta({ layout: 'study' });
useSeo({ title: t('seo.reviewTitle'), description: t('seo.appDesc'), noindex: true });
</script>
