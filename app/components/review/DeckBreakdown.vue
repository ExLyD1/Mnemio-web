<template>
    <div class="w-full max-w-md rounded-[20px] border border-line bg-bg-surface p-5 text-left">
        <p class="text-eyebrow uppercase text-brand-muted">{{ t('review.perDeckTitle') }}</p>
        <ul class="mt-3 flex flex-col divide-y divide-line">
            <li
                v-for="row in rows"
                :key="row.deckId"
                class="flex items-baseline justify-between gap-3 py-2"
            >
                <span class="min-w-0 truncate font-semibold text-cream">{{ row.title }}</span>
                <span class="shrink-0 text-small tabular-nums text-brand-muted">
                    {{
                        t('review.perDeckRow')
                            .replace('{n}', String(row.reviewed))
                            .replace('{pct}', String(row.pct))
                    }}
                </span>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
export interface DeckBreakdownRow {
    deckId: string;
    title: string;
    reviewed: number;
    /** Share of answers that weren't "again", 0–100. */
    pct: number;
}

defineProps<{ rows: DeckBreakdownRow[] }>();
const { t } = useT();
</script>
