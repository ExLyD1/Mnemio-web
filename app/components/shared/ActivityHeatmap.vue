<template>
    <div>
        <div class="overflow-x-auto pb-1">
            <div class="flex w-full justify-between">
                <div v-for="(week, wi) in weeks" :key="wi" class="flex flex-col gap-[3px]">
                    <span
                        v-for="(lvl, di) in week"
                        :key="di"
                        :class="['size-2.5 rounded-sm', levelClass[lvl] ?? levelClass[0]]"
                    />
                </div>
            </div>
        </div>
        <div class="mt-3 flex items-center gap-1.5 text-small text-brand-muted">
            <span>Less</span>
            <span v-for="l in 5" :key="l" :class="['size-2.5 rounded-sm', levelClass[l - 1]]" />
            <span>More</span>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{ weeks: number[][] }>();

const levelClass = ['bg-line', 'bg-brand/30', 'bg-brand/50', 'bg-brand/70', 'bg-brand'];
</script>
