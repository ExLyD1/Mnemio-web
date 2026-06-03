<template>
    <div class="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        <button
            v-for="g in GRADES"
            :key="g.key"
            type="button"
            :class="[
                'relative flex flex-col items-center gap-1 rounded-2xl border px-4 py-3 transition-all hover:-translate-y-0.5',
                toneClass[g.tone],
            ]"
            @click="$emit('grade', g.key)"
        >
            <StudyKeycap :label="g.hint" class="absolute right-2 top-2" />
            <span class="text-body font-semibold">{{ g.label }}</span>
            <span class="text-small opacity-70">{{ g.interval }}</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { GRADES } from '@/utils/grades';
import type { SrsRating } from '@/types/srs';

defineEmits<{ grade: [rating: SrsRating] }>();

const toneClass = {
    ghost: 'border-line-strong text-error-soft hover:border-error-soft/60',
    dark: 'border-line-strong bg-white/[0.03] text-brand-pale',
    good: 'border-brand-bright bg-brand/30 text-cream',
    easy: 'border-success/50 bg-success/15 text-success-bright',
} as const;
</script>
