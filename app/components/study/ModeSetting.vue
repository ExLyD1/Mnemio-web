<template>
    <div class="rounded-[20px] border border-line bg-bg-surface p-6">
        <UiSelect
            :model-value="prefs.store.defaultStudyMode ?? ''"
            :label="t('practice.setting')"
            :options="options"
            :disabled="!prefs.store.loaded || prefs.update.loading.value"
            @update:model-value="change"
        />
    </div>
</template>
<script setup lang="ts">
import { usePracticePreferences } from '@/composables/usePracticePreferences';
const prefs = usePracticePreferences();
const { t } = useT();
const { apiErrorText } = useApiError();
const toast = useToast();
const options = computed(() => [
    { value: '', label: t('practice.askEveryTime') },
    { value: 'srs', label: t('practice.srs') },
    { value: 'know', label: t('practice.know') },
]);
const change = async (value: string) => {
    const defaultStudyMode = value === 'srs' || value === 'know' ? value : null;
    const saved = await prefs.update.execute({ defaultStudyMode });
    if (!saved) toast.error(apiErrorText(prefs.update.error.value));
    else toast.success(t('profile.saved'));
};
</script>
