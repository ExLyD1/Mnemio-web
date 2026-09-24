<template>
    <div :class="['rounded-[20px] border p-5', tones[tone]]">
        <div class="flex items-start justify-between gap-2">
            <p
                class="flex items-center gap-1 text-small font-semibold uppercase tracking-[0.08em] text-brand-muted"
            >
                {{ label }}
                <span
                    v-if="info"
                    :title="info"
                    :aria-label="info"
                    class="inline-flex cursor-help text-brand-muted/70"
                >
                    <Info class="size-3.5" />
                </span>
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
        <p :class="['mt-2 font-display text-h1 leading-none', numerals[tone]]">{{ value }}</p>
        <p v-if="sub" class="mt-1 text-small text-cream-faint">{{ sub }}</p>
    </div>
</template>

<script setup lang="ts">
import { ArrowUp, ArrowDown, Info } from 'lucide-vue-next';

withDefaults(
    defineProps<{
        label: string;
        value: string | number;
        sub?: string;
        info?: string;
        tone?: 'plain' | 'plum' | 'accent' | 'blue' | 'green' | 'pink';
        trend?: { dir: 'up' | 'down'; label: string };
    }>(),
    { tone: 'plain' },
);

const tones = {
    plain: 'border-line-strong bg-bg-surface-2',
    plum: 'border-lavender/70 bg-lavender/30 dark:border-brand-bright/70 dark:bg-brand/45',
    accent: 'border-accent/50 bg-accent/20',
    blue: 'border-accent/70 bg-gradient-to-br from-accent/40 to-accent/25',
    green: 'border-success/70 bg-gradient-to-br from-success/40 to-success/25',
    pink: 'border-pink/70 bg-gradient-to-br from-pink/40 to-error-soft/25',
} as const;

/*
 * Numerals come from the stat palette (specs §Statistics: "stat-tile numerals use
 * D.stat1..D.stat4 — never literal hexes. Order: blue, neutral, green, pink").
 * Every tile background here is a translucent TINT over a card surface, so these
 * are cream-side inks and darken correctly in light mode.
 */
const numerals = {
    plain: 'text-stat-2',
    plum: 'text-stat-2',
    accent: 'text-stat-1',
    blue: 'text-stat-1',
    green: 'text-stat-3',
    pink: 'text-stat-4',
} as const;
</script>
