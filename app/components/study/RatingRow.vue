<template>
    <div class="grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
        <button
            v-for="g in GRADES"
            :key="g.key"
            type="button"
            :class="[
                'relative flex min-h-[44px] flex-col items-center gap-1 rounded-2xl border px-4 py-3 transition-all hover:shadow-md hover:shadow-brand/15',
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
    ghost: 'border-error bg-error/16 text-[#F26D6D] hover:bg-error/24',
    dark: 'border-vib-amber bg-vib-amber/18 text-[oklch(.82_.14_75)] hover:bg-vib-amber/28',
    good: 'border-lavender bg-lavender/24 text-[#D9C7F5] hover:bg-lavender/32',
    easy: 'border-success bg-success text-[#2E3613] hover:brightness-110',
} as const;
</script>
