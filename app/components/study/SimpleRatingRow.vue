<template>
    <div class="grid w-full max-w-md grid-cols-2 gap-3">
        <button
            type="button"
            class="relative flex min-h-[44px] flex-col items-center gap-1 rounded-2xl border border-error bg-bg-surface px-4 py-3 text-error transition-all hover:shadow-md hover:shadow-brand/15 dark:bg-error/10"
            @click="$emit('answer', false)"
        >
            <StudyKeycap label="1" class="absolute right-2 top-2" />
            <X class="size-5" />
            <span class="text-body font-semibold">{{ t('study.simpleForgot') }}</span>
        </button>
        <button
            type="button"
            class="relative flex min-h-[44px] flex-col items-center gap-1 rounded-2xl border border-success bg-bg-surface px-4 py-3 text-success transition-all hover:shadow-md hover:shadow-brand/15 dark:bg-success/10"
            @click="$emit('answer', true)"
        >
            <StudyKeycap label="2" class="absolute right-2 top-2" />
            <Check class="size-5" />
            <span class="text-body font-semibold">{{ t('study.simpleKnow') }}</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { Check, X } from 'lucide-vue-next';
import { useT } from '@/composables/useT';

const { t } = useT();

defineEmits<{ answer: [correct: boolean] }>();
</script>
