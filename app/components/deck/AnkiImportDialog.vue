<template>
    <UiModal
        :model-value="modelValue"
        :title="t('anki.title')"
        :dismissible="!upload.loading.value"
        :close-on-backdrop="!upload.loading.value"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <div class="max-h-[70vh] space-y-5 overflow-y-auto text-cream">
            <template v-if="upload.data.value">
                <p class="text-body font-semibold">
                    {{
                        `${t('anki.importedCards', upload.data.value.cardsImported)} · ${t('anki.importedDecks', upload.data.value.decks.length)}`
                    }}
                </p>
                <ul class="space-y-2">
                    <li v-for="deck in upload.data.value.decks" :key="deck.id">
                        <NuxtLink :to="`/decks/${deck.id}`" class="break-words underline"
                            >{{ deck.title }} · {{ deck.cardCount }}</NuxtLink
                        >
                    </li>
                </ul>
                <p>
                    {{ t('anki.skipped').replace('{n}', String(upload.data.value.cardsSkipped)) }} ·
                    {{ t('anki.media', upload.data.value.mediaImported) }}
                </p>
                <p v-if="store.refreshFailed" class="text-small">{{ t('anki.refreshFailed') }}</p>
                <details
                    v-if="upload.data.value.warnings.length"
                    class="rounded-xl border border-line p-3"
                >
                    <summary class="cursor-pointer">
                        {{
                            t('anki.warnings').replace(
                                '{n}',
                                String(upload.data.value.warnings.length),
                            )
                        }}
                    </summary>
                    <ul class="mt-2 list-disc space-y-1 break-words pl-5 text-small">
                        <li v-for="(warning, index) in upload.data.value.warnings" :key="index">
                            {{ warning }}
                        </li>
                    </ul>
                </details>
                <UiButton v-if="upload.data.value.decks[0]" @click="openFirst">{{
                    t('anki.openDeck')
                }}</UiButton>
            </template>
            <template v-else>
                <label
                    class="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors"
                    :class="dragging ? 'border-brand bg-brand/10' : 'border-line-strong'"
                    @dragover.prevent="dragging = true"
                    @dragleave.prevent="dragging = false"
                    @drop.prevent="onDrop"
                >
                    <Upload class="size-8 text-brand-muted" />
                    <span class="[overflow-wrap:anywhere]">{{
                        file?.name || t('anki.dropFile')
                    }}</span>
                    <input
                        class="w-full text-small"
                        type="file"
                        accept=".apkg"
                        :disabled="upload.loading.value"
                        :aria-label="t('anki.file')"
                        @change="onFile"
                    />
                </label>
                <UiSelect
                    v-model="frontLanguage"
                    :options="languageOptions"
                    :label="t('anki.frontLanguage')"
                    :disabled="upload.loading.value"
                />
                <UiSelect
                    v-model="backLanguage"
                    :options="languageOptions"
                    :label="t('anki.backLanguage')"
                    :disabled="upload.loading.value"
                />
                <p
                    v-if="localError || upload.error.value"
                    role="alert"
                    class="text-small text-error"
                >
                    {{ localError || apiErrorText(upload.error.value) }}
                </p>
                <UiButton :disabled="!file || upload.loading.value" @click="submit"
                    ><UiSpinner v-if="upload.loading.value" size="sm" />{{
                        t(upload.loading.value ? 'anki.uploading' : 'anki.import')
                    }}</UiButton
                >
            </template>
        </div>
    </UiModal>
</template>

<script setup lang="ts">
import { Upload } from 'lucide-vue-next';
import { useApkgImport } from '@/composables/useApkgImport';
import { usePracticePreferences } from '@/composables/usePracticePreferences';
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const { t } = useT();
const { apiErrorText } = useApiError();
const { options: languageOptions } = useLanguageName();
const { store, upload } = useApkgImport();
const prefs = usePracticePreferences();
const file = ref<File | null>(null);
const dragging = ref(false);
const localError = ref('');
const frontLanguage = ref('en');
const backLanguage = ref('uk');
const selectFile = (selected?: File) => {
    if (upload.loading.value || !selected) return;
    localError.value = '';
    upload.error.value = null;
    if (!selected.name.toLowerCase().endsWith('.apkg')) {
        localError.value = t('errors.IMPORT_APKG_INVALID');
        file.value = null;
        return;
    }
    file.value = selected;
};
const onFile = (event: Event) => selectFile((event.target as HTMLInputElement).files?.[0]);
const onDrop = (event: DragEvent) => {
    dragging.value = false;
    selectFile(event.dataTransfer?.files[0]);
};
const submit = async () => {
    if (!file.value || upload.loading.value) return;
    await upload.execute(file.value, backLanguage.value, frontLanguage.value);
};
const openFirst = () => {
    const first = upload.data.value?.decks[0];
    if (!first) return;
    emit('update:modelValue', false);
    navigateTo(`/decks/${first.id}`);
};
watch(
    () => props.modelValue,
    async (open) => {
        if (!open || upload.loading.value) return;
        file.value = null;
        localError.value = '';
        upload.data.value = null;
        upload.error.value = null;
        if (!prefs.store.loaded) await prefs.hydrate.execute();
        frontLanguage.value = prefs.store.learningLanguages[0] ?? 'en';
        backLanguage.value = prefs.store.nativeLanguage ?? 'uk';
    },
);
</script>
