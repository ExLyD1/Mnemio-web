<template>
    <Transition name="panel-slide">
        <aside
            v-if="modelValue"
            class="fixed inset-0 z-50 flex w-full flex-col border-line-strong bg-bg-surface md:inset-y-0 md:left-auto md:right-0 md:z-30 md:w-[360px] md:border-l"
        >
            <!-- Header -->
            <header class="flex items-center gap-2 border-b border-line px-4 py-3">
                <SharedMimi :size="32" class="shrink-0" />
                <p class="flex-1 font-display text-base text-cream">{{ t('ai.titleAppend') }}</p>
                <button
                    type="button"
                    class="grid size-8 place-items-center rounded-full text-brand-muted transition-colors hover:bg-brand/15 hover:text-cream"
                    :aria-label="t('common.cancel')"
                    @click="close"
                >
                    <X class="size-4" />
                </button>
            </header>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto p-4">
                <!-- Step 1: paste words -->
                <div v-if="step === 'input'" class="flex flex-col gap-4">
                    <div>
                        <span class="mb-1 block text-small text-brand-muted">
                            {{ t('ai.wordsLabel') }}
                        </span>
                        <textarea
                            v-model="rawWords"
                            rows="6"
                            :placeholder="t('ai.wordsPlaceholder')"
                            class="w-full resize-y rounded-xl border border-brand-muted bg-transparent px-4 py-2.5 text-body text-brand-pale outline-none focus:border-brand-bright"
                        />
                        <p class="mt-1 text-small text-brand-muted">
                            {{ t('ai.wordsHint').replace('{n}', String(parsedCount)) }}
                        </p>
                    </div>

                    <UiInputField
                        v-model="context"
                        :label="t('ai.contextLabel')"
                        :placeholder="t('ai.contextPlaceholder')"
                    />

                    <p v-if="error" class="text-small text-error-soft">{{ error }}</p>
                </div>

                <!-- Step 2: review -->
                <div v-else class="flex flex-col gap-3">
                    <div class="flex flex-wrap items-baseline gap-x-2">
                        <p class="text-small text-brand-muted">{{ t('ai.reviewHint') }}</p>
                        <span v-if="unfilledCount" class="text-small text-error-soft">
                            {{ t('ai.unfilledCount').replace('{n}', String(unfilledCount)) }}
                        </span>
                    </div>

                    <div
                        v-for="(row, i) in rows"
                        :key="i"
                        class="flex items-start gap-3 rounded-xl border p-3"
                        :class="rowTone(row)"
                    >
                        <input
                            v-model="row.include"
                            type="checkbox"
                            class="mt-2.5 size-4 shrink-0 accent-brand-bright"
                            :aria-label="t('ai.includeCard')"
                        />
                        <div class="flex min-w-0 flex-1 flex-col gap-2">
                            <input
                                v-model="row.word"
                                type="text"
                                :placeholder="t('card.word')"
                                class="w-full break-words rounded-lg border border-brand-muted bg-transparent px-3 py-1.5 font-display text-base text-cream outline-none focus:border-brand-bright"
                            />
                            <textarea
                                v-model="row.definition"
                                rows="2"
                                :placeholder="t('ai.definitionPlaceholder')"
                                class="w-full resize-y rounded-lg border border-brand-muted bg-transparent px-3 py-1.5 text-small text-brand-pale outline-none focus:border-brand-bright"
                            />
                        </div>
                        <button
                            type="button"
                            class="mt-1.5 shrink-0 rounded-md p-1 text-brand-muted transition-colors hover:text-error-soft"
                            :aria-label="t('ai.remove')"
                            @click="rows.splice(i, 1)"
                        >
                            <Trash2 class="size-4" />
                        </button>
                    </div>

                    <p v-if="error" class="text-small text-error-soft">{{ error }}</p>
                </div>
            </div>

            <!-- Footer -->
            <div class="flex justify-end gap-2 border-t border-line p-3">
                <template v-if="step === 'input'">
                    <UiButton variant="ghost" @click="close">{{ t('common.cancel') }}</UiButton>
                    <UiButton
                        variant="primary"
                        :disabled="!parsedCount || loading"
                        @click="onEnrich"
                    >
                        <UiSpinner v-if="loading" size="sm" class="mr-2" />
                        {{ loading ? t('ai.generating') : t('ai.generate') }}
                    </UiButton>
                </template>
                <template v-else>
                    <UiButton variant="ghost" :disabled="committing" @click="step = 'input'">
                        {{ t('common.back') }}
                    </UiButton>
                    <UiButton
                        variant="primary"
                        :disabled="!committableCount || committing"
                        @click="onCommit"
                    >
                        <UiSpinner v-if="committing" size="sm" class="mr-2" />
                        {{ t('ai.addN').replace('{n}', String(committableCount)) }}
                    </UiButton>
                </template>
            </div>
        </aside>
    </Transition>

    <!-- Mobile backdrop -->
    <div v-if="modelValue" class="fixed inset-0 z-10 lg:hidden" @click="close" />
</template>

<script setup lang="ts">
import { Trash2, X } from 'lucide-vue-next';
import { useT } from '#imports';
import { useAiImport } from '@/composables/useAiImport';

const props = defineProps<{
    modelValue: boolean;
    deck: { id: string; sourceLanguage: string; targetLanguage: string };
}>();

const emit = defineEmits<{ 'update:modelValue': [boolean]; done: [] }>();

const { t } = useT();

const close = () => emit('update:modelValue', false);

const {
    step,
    rawWords,
    context,
    rows,
    loading,
    committing,
    error,
    parsedCount,
    committableCount,
    unfilledCount,
    rowTone,
    reset,
    onEnrich,
    onCommit,
} = useAiImport({
    deck: () => props.deck,
    onAppended: () => {
        emit('done');
        close();
    },
});

watch(
    () => props.modelValue,
    (open) => {
        if (open) {
            reset();
        }
    },
);
</script>

<style scoped>
.panel-slide-enter-active,
.panel-slide-leave-active {
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.panel-slide-enter-from,
.panel-slide-leave-to {
    transform: translateX(100%);
}
</style>
