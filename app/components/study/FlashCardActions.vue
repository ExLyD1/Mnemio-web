<template>
    <div class="flex flex-col items-center gap-3">
        <p v-if="!flipped" class="text-small text-cream-faint">
            {{ t('study.flipHint') }}
        </p>
        <div class="flex gap-3" :class="{ 'pointer-events-none opacity-40': !flipped }">
            <button
                type="button"
                class="rounded-full border border-pink-soft/40 bg-white/[0.04] px-5 py-2.5 text-small font-semibold text-pink-soft transition-colors hover:bg-pink-soft/10"
                :disabled="!flipped"
                @click="$emit('answer', false)"
            >
                {{ t('study.unknown') }}
            </button>
            <button
                type="button"
                class="rounded-full border border-success/40 bg-white/[0.04] px-5 py-2.5 text-small font-semibold text-success transition-colors hover:bg-success/10"
                :disabled="!flipped"
                @click="$emit('answer', true)"
            >
                {{ t('study.known') }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useT } from '@/composables/useT';

defineProps<{ flipped: boolean }>();
defineEmits<{ answer: [correct: boolean] }>();

const { t } = useT();
</script>
