<template>
    <div class="flex flex-col gap-4 rounded-[20px] border border-line bg-bg-surface p-6">
        <UiSelect
            :model-value="prefs.store.defaultStudyMode ?? ''"
            :label="t('practice.setting')"
            :options="options"
            :disabled="!prefs.store.loaded || prefs.update.loading.value"
            @update:model-value="change"
        />
        <div>
            <UiSelect
                :model-value="front.side.value"
                :label="t('study.frontSide')"
                :options="frontOptions"
                @update:model-value="changeFront"
            />
            <p class="mt-1 text-small text-cream-faint">{{ t('study.frontSideHint') }}</p>
        </div>
    </div>
</template>
<script setup lang="ts">
import { useFrontSide, usePracticePreferences } from '@/composables/usePracticePreferences';
const prefs = usePracticePreferences();
const front = useFrontSide();
const analytics = useAnalytics();
const { t } = useT();
const { apiErrorText } = useApiError();
const toast = useToast();
const options = computed(() => [
    { value: '', label: t('practice.askEveryTime') },
    { value: 'srs', label: t('practice.srs') },
    { value: 'know', label: t('practice.know') },
]);
const frontOptions = computed(() => [
    { value: 'term', label: t('study.frontSideTerm') },
    { value: 'definition', label: t('study.frontSideDefinition') },
]);
const change = async (value: string) => {
    const defaultStudyMode = value === 'srs' || value === 'know' ? value : null;
    const saved = await prefs.update.execute({ defaultStudyMode });
    if (!saved) toast.error(apiErrorText(prefs.update.error.value));
    else toast.success(t('profile.saved'));
};
const changeFront = (value: string) => {
    const side = value === 'definition' ? 'definition' : 'term';
    front.set(side);
    analytics.track('study_front_side_changed', { front_side: side });
};
</script>
