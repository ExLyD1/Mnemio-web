<template>
    <template v-if="scope">
        <StudySession
            v-if="scope.mode"
            :key="route.fullPath"
            :deck-ids="scope.deckIds ?? undefined"
            :order="scope.order"
            :mode="scope.mode"
            format="flashcard"
        />
        <SharedPageLoader v-else />
    </template>
    <ReviewHub v-else />
</template>
<script setup lang="ts">
import { parseReviewScope, reviewScopeQuery } from '@/utils/reviewScope';
import { usePracticePreferences } from '@/composables/usePracticePreferences';

const route = useRoute();
const prefs = usePracticePreferences();
const scope = computed(() => parseReviewScope(route.query));

// Every scoped URL carries `decks` and `mode`: legacy `?mode=` links mean
// "everything due", and a missing mode resolves to the user's default.
watch(
    () => route.fullPath,
    async () => {
        const current = scope.value;
        if (!current || (current.mode && route.query.decks !== undefined)) return;
        if (!current.mode && !prefs.store.loaded) await prefs.hydrate.execute();
        const mode = current.mode ?? prefs.store.defaultStudyMode ?? 'srs';
        await navigateTo(
            { path: '/review', query: reviewScopeQuery({ ...current, mode }) },
            { replace: true },
        );
    },
    { immediate: true },
);

const { t } = useT();
definePageMeta({
    layout: 'study',
    // The hub lives in the app shell; a running review takes the whole screen.
    // Decided before render (and on query-only navigations) so nothing flashes.
    middleware: [
        (to) => {
            setPageLayout(parseReviewScope(to.query) ? 'study' : 'default');
        },
    ],
});
useSeo({ title: t('seo.reviewTitle'), description: t('seo.appDesc'), noindex: true });
</script>
