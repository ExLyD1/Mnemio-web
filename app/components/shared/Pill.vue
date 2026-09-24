<template>
    <span
        :class="[
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-small font-semibold',
            tones[tone],
        ]"
    >
        <slot />
    </span>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{ tone?: 'muted' | 'plum' | 'due' | 'accent' | 'success' | 'on-plum' }>(),
    { tone: 'muted' },
);

const tones = {
    muted: 'border-line-strong text-cream-dim',
    // bg-brand/30 is a translucent plum *tint* — a light lavender in light mode —
    // so its ink stays on the cream ladder, not on-plum.
    plum: 'border-brand-bright/45 bg-brand/30 text-cream',
    // "N due" was pink-on-pink and unreadable; the specs pin it to purple on
    // purple-soft at weight 700 (dark spec §Decks).
    due: 'border-purple/40 bg-purple-soft font-bold text-purple',
    accent: 'border-accent/40 text-accent',
    success: 'border-success/40 text-success',
    // For pills sitting ON a plum/gradient fill (dark spec §Practice).
    'on-plum': 'border-on-plum/25 text-on-plum',
} as const;
</script>
