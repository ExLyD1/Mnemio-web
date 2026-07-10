<template>
    <div class="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        <button
            v-for="g in GRADES"
            :key="g.key"
            type="button"
            :class="[
                'relative flex min-h-[44px] flex-col items-center gap-1 rounded-2xl border bg-bg-surface px-4 py-3 transition-all hover:shadow-md hover:shadow-brand/15',
                toneClass[g.tone],
            ]"
            @click="$emit('grade', g.key)"
        >
            <StudyKeycap :label="g.hint" class="absolute right-2 top-2" />
            <span class="text-body font-semibold">{{ t(g.i18nKey) }}</span>
            <span class="text-small opacity-70">{{ g.interval }}</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { GRADES } from '@/utils/grades';
import { useT } from '@/composables/useT';
import type { SrsRating } from '@/types/srs';

const { t } = useT();

defineEmits<{ grade: [rating: SrsRating] }>();

// Light: border + text colour only. Dark: add a faint bg tint.
const toneClass: Record<string, string> = {
    ghost: 'border-error text-error dark:bg-error/10',
    dark: 'border-vib-amber text-vib-amber dark:bg-vib-amber/10',
    good: 'border-brand-bright text-brand-bright dark:bg-brand/15',
    easy: 'border-success text-success dark:bg-success/10',
};
</script>
