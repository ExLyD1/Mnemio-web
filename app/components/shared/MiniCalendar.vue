<template>
    <div>
        <div class="mb-3 flex items-center justify-between">
            <p class="font-display text-lg text-cream">{{ monthLabel }}</p>
            <div class="flex gap-1">
                <button
                    type="button"
                    class="grid size-7 place-items-center rounded-lg text-brand-muted transition-colors hover:bg-white/[0.04] hover:text-cream"
                    aria-label="Previous month"
                    @click="$emit('prev')"
                >
                    <ChevronLeft class="size-4" />
                </button>
                <button
                    type="button"
                    class="grid size-7 place-items-center rounded-lg text-brand-muted transition-colors hover:bg-white/[0.04] hover:text-cream"
                    aria-label="Next month"
                    @click="$emit('next')"
                >
                    <ChevronRight class="size-4" />
                </button>
            </div>
        </div>
        <div class="grid grid-cols-7 gap-1.5 text-center text-[11px] text-brand-muted">
            <span v-for="(d, i) in dows" :key="i">{{ d }}</span>
        </div>
        <div class="mt-1.5 grid grid-cols-7 gap-1.5">
            <template v-for="(week, wi) in weeks" :key="wi">
                <div
                    v-for="(cell, ci) in week"
                    :key="`${wi}-${ci}`"
                    :class="[
                        'aspect-square rounded-md',
                        cell.inMonth ? levelClass[cell.level] : 'opacity-0',
                        cell.today ? 'ring-1 ring-brand-bright' : '',
                    ]"
                />
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import type { HeatCell } from '@/composables/useStats';

defineProps<{ weeks: HeatCell[][]; monthLabel: string }>();
defineEmits<{ prev: []; next: [] }>();

const dows = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const levelClass = ['bg-line', 'bg-brand/30', 'bg-brand/50', 'bg-brand/70', 'bg-brand'];
</script>
