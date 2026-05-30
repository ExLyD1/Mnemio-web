<template>
    <div
        class="rounded-[22px] border border-line-strong bg-gradient-to-b from-bg-landing-2 to-bg-landing p-[18px] shadow-soft-elevation"
    >
        <div class="flex items-center gap-2 border-b border-line pb-3.5">
            <span class="size-2.5 rounded-full bg-plum" />
            <span class="size-2.5 rounded-full bg-lavender" />
            <span class="size-2.5 rounded-full bg-pink-soft" />
            <span
                class="ml-3.5 rounded-md border border-line bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-cream-faint"
            >
                mnemio.app/home
            </span>
        </div>

        <div class="grid grid-cols-[56px_1fr] gap-3.5 pt-3.5">
            <div
                class="flex flex-col items-center gap-4 rounded-xl bg-[#08060A] px-1.5 py-3.5"
            >
                <span class="grid size-8 place-items-center rounded-lg bg-plum text-cream">
                    <Menu class="size-3.5" />
                </span>
                <span
                    v-for="icon in sideIcons"
                    :key="icon.label"
                    class="grid size-8 place-items-center rounded-lg border border-line text-cream-dim"
                >
                    <component :is="icon.comp" class="size-3.5" />
                </span>
                <span class="flex-1" />
                <span class="grid size-8 place-items-center rounded-lg bg-plum text-pink-soft">
                    <Sparkles class="size-3.5" />
                </span>
            </div>

            <div class="p-1">
                <div class="mb-3 flex items-center justify-between">
                    <div class="font-display text-[18px] text-cream">Home</div>
                    <div class="flex items-center gap-2 text-[11px] text-cream-faint">
                        <Search class="size-3.5" />
                        <span>Search decks</span>
                    </div>
                </div>

                <div class="mb-3.5 grid grid-cols-[1.3fr_1fr] gap-3.5">
                    <div class="rounded-[14px] border border-line bg-bg-surface-2 p-4">
                        <div class="flex justify-between">
                            <h4 class="text-[15px] font-semibold text-cream">Japanese Core 1k</h4>
                            <Bookmark class="size-4 text-lavender" />
                        </div>
                        <div class="mt-1.5 text-[11px] text-cream-faint">
                            Total cards: 1,032 · Studied today: 42
                        </div>
                        <div class="mb-1.5 mt-3 h-1.5 overflow-hidden rounded-md bg-white/[0.05]">
                            <span class="block h-full w-[62%] bg-progress-cream-lavender" />
                        </div>
                        <div class="text-right text-[11px] text-cream-faint">Mastered: 62%</div>
                        <div class="mt-3 flex items-center justify-between gap-2">
                            <button
                                class="inline-flex items-center gap-1 rounded-full border border-line-strong bg-transparent px-2.5 py-1 text-[11px] text-cream-dim"
                            >
                                <Plus class="size-3" /> Add cards
                            </button>
                            <button
                                class="rounded-full border border-pink-soft/30 bg-plum px-2.5 py-1 text-[11px] text-cream"
                            >
                                Practice
                            </button>
                        </div>
                    </div>

                    <div class="rounded-[14px] border border-line bg-bg-surface-2 p-4">
                        <div class="mb-3 flex items-center justify-between">
                            <h4 class="text-[15px] font-semibold text-cream">March</h4>
                            <span class="flex items-center gap-1 text-[11px] text-cream-faint">
                                Streak · 18d
                                <Flame class="size-3 text-pink-soft" />
                            </span>
                        </div>
                        <div class="grid grid-cols-7 gap-1.5 text-[11px] text-cream-dim">
                            <div
                                v-for="d in ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']"
                                :key="d"
                                class="pb-1 text-center text-[10px] uppercase tracking-wider text-cream-faint"
                            >
                                {{ d }}
                            </div>
                            <div
                                v-for="(cell, i) in calendarCells"
                                :key="i"
                                :class="[
                                    'rounded-md py-1 text-center text-cream-faint',
                                    cell.now && 'bg-cream font-bold text-[#1A0F22]',
                                    cell.on && !cell.now && 'bg-plum text-cream',
                                    cell.dim && 'opacity-40',
                                ]"
                            >
                                {{ cell.dim ? '' : cell.day }}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mb-2.5 text-[11px] text-cream-faint">Recent decks</div>
                <div class="grid grid-cols-3 gap-2.5">
                    <div
                        v-for="deck in recentDecks"
                        :key="deck.name"
                        class="rounded-[14px] border border-line bg-bg-surface-2 p-3.5"
                    >
                        <div class="flex justify-between">
                            <h5 class="text-[13px] font-semibold text-cream">{{ deck.name }}</h5>
                            <Flame class="size-3 text-pink-soft" />
                        </div>
                        <div class="my-2 h-1 overflow-hidden rounded bg-white/[0.05]">
                            <span
                                class="block h-full bg-progress-cream-lavender"
                                :style="{ width: `${deck.pct * 100}%` }"
                            />
                        </div>
                        <div class="text-[11px] text-cream-faint">
                            Mastered {{ Math.round(deck.pct * 100) }}%
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Menu, Search, Bookmark, Plus, Flame, Home, Layers, Sparkles } from 'lucide-vue-next';

const sideIcons = [
    { label: 'Home', comp: Home },
    { label: 'Library', comp: Layers },
    { label: 'Favorites', comp: Bookmark },
];

const calendarCells = Array.from({ length: 35 }, (_, i) => {
    const day = i - 2;
    return {
        day,
        now: day === 20,
        on: [3, 4, 5, 7, 9, 10, 11, 12, 15, 16, 17, 18, 19].includes(day),
        dim: day < 1 || day > 31,
    };
});

const recentDecks = [
    { name: 'French verbs', pct: 0.84 },
    { name: 'Anatomy: thorax', pct: 0.41 },
    { name: 'SAT vocab', pct: 0.67 },
];
</script>
