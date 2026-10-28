<template>
    <div class="rounded-2xl bg-bg-deep px-[22px] py-5">
        <p class="text-[11px] font-extrabold uppercase tracking-[.16em] text-cream-faint">
            {{ label }}
        </p>
        <p
            :class="[
                'mt-2 font-display leading-tight tabular-nums',
                long ? 'text-[26px] lg:text-[30px]' : 'text-[32px] lg:text-[40px]',
                tone === 'bad' ? 'text-error-soft' : tone === 'warn' ? 'text-warn' : 'text-cream',
            ]"
        >
            {{ text }}
        </p>
        <p v-if="caption" class="mt-1 text-[14px] text-cream-faint">{{ caption }}</p>
    </div>
</template>
<script setup lang="ts">
const props = defineProps<{
    label: string;
    value: string | number;
    caption?: string;
    tone?: 'bad' | 'warn';
}>();
// Intl joins amount and currency with a no-break space ("10,00 USD"); a normal space
// lets the currency wrap to its own line instead of overflowing the tile.
const text = computed(() => String(props.value).replace(/[  ]/g, ' '));
// Values like "10,00 USD" or "Без обмежень" don't fit the 40px serif at tile width.
const long = computed(() => text.value.length > 8);
</script>
