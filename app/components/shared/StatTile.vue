<template>
    <div :class="['rounded-[20px] border p-5', tones[tone]]">
        <div class="flex items-start justify-between gap-2">
            <p class="text-small font-semibold uppercase tracking-[0.08em] text-brand-muted">
                {{ label }}
            </p>
            <span
                v-if="trend"
                :class="[
                    'inline-flex items-center gap-0.5 text-small font-semibold',
                    trend.dir === 'up' ? 'text-success-bright' : 'text-error-soft',
                ]"
            >
                <component :is="trend.dir === 'up' ? ArrowUp : ArrowDown" class="size-3.5" />
                {{ trend.label }}
            </span>
        </div>
        <p class="mt-2 font-display text-h1 leading-none text-cream">{{ value }}</p>
        <p v-if="sub" class="mt-1 text-small text-cream-faint">{{ sub }}</p>
    </div>
</template>

<script setup lang="ts">
import { ArrowUp, ArrowDown } from 'lucide-vue-next';

withDefaults(
    defineProps<{
        label: string;
        value: string | number;
        sub?: string;
        tone?: 'plain' | 'plum' | 'accent' | 'blue' | 'green' | 'pink';
        trend?: { dir: 'up' | 'down'; label: string };
    }>(),
    { tone: 'plain' },
);

const tones = {
    plain: 'border-line bg-bg-surface',
    plum: 'border-lavender/60 bg-lavender/20 dark:border-brand-bright/40 dark:bg-brand/25',
    accent: 'border-accent/30 bg-accent/10',
    blue: 'border-accent-light/45 bg-gradient-to-br from-accent-light/25 to-accent/15',
    green: 'border-success/45 bg-gradient-to-br from-success-bright/25 to-success/15',
    pink: 'border-pink-soft/45 bg-gradient-to-br from-pink-soft/25 to-error-soft/15',
} as const;
</script>
