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
    ghost: 'border-error/50 bg-error/10 text-error hover:bg-error/18',
    dark: 'border-line-strong bg-bg-surface text-brand-pale hover:bg-bg-surface-2',
    good: 'border-brand-bright bg-brand/35 text-on-color hover:bg-brand/45',
    easy: 'border-success/80 bg-success/40 text-[#5d9e0a] hover:bg-success/50',
} as const;
</script>
