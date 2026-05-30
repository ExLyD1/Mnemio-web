<template>
    <section id="demo" class="border-t border-line px-8 py-28">
        <div class="mx-auto max-w-[1240px]">
            <div
                class="mb-10 flex flex-wrap items-end justify-between gap-5"
            >
                <div>
                    <div class="mb-4 flex items-center gap-3">
                        <span class="h-px w-6 bg-lavender" />
                        <span class="text-eyebrow uppercase text-cream-faint">Try a session</span>
                    </div>
                    <h2
                        class="font-display text-[clamp(34px,4.6vw,60px)] font-light leading-[1.04] tracking-[-0.025em] text-cream"
                    >
                        Five cards. Two minutes.<br />One honest demo.
                    </h2>
                </div>
                <div class="flex items-center gap-5">
                    <div class="text-right">
                        <div class="text-[12px] text-cream-faint">Session score</div>
                        <div class="font-display text-[28px] text-cream">
                            {{ pct }}<span class="text-[14px] text-cream-faint">%</span>
                        </div>
                    </div>
                    <button
                        class="rounded-full border border-line-strong px-2.5 py-1 text-[11px] text-cream-dim transition-colors hover:bg-white/[0.03]"
                        @click="reset"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div class="grid gap-7 lg:grid-cols-[1fr_320px]">
                <div
                    class="relative min-h-[460px] rounded-3xl border border-line bg-bg-surface p-10"
                >
                    <div
                        class="absolute left-7 top-6 flex items-center gap-2.5 text-[12px] uppercase tracking-[0.16em] text-cream-faint"
                    >
                        <span>{{ card.tag }}</span>
                        <span class="opacity-40">·</span>
                        <span>{{ (idx % deck.length) + 1 }} / {{ deck.length }}</span>
                    </div>
                    <div class="absolute right-7 top-6 text-[12px] text-cream-faint">
                        {{ card.lang }}
                    </div>

                    <div
                        class="mt-9 flex min-h-[320px] cursor-pointer items-center justify-center"
                        style="perspective: 1400px"
                        role="button"
                        aria-label="Flip card"
                        @click="flipped = !flipped"
                    >
                        <div
                            class="relative w-full"
                            :style="{
                                minHeight: '280px',
                                transformStyle: 'preserve-3d',
                                transition: 'transform .8s cubic-bezier(.6,.1,.3,1)',
                                transform: flipped ? 'rotateX(180deg)' : 'rotateX(0)',
                            }"
                        >
                            <div
                                class="absolute inset-0 flex flex-col items-center justify-center gap-3.5 text-center"
                                style="backface-visibility: hidden"
                            >
                                <div class="text-eyebrow uppercase text-cream-faint">Front</div>
                                <div
                                    class="font-display leading-[1.05] text-cream"
                                    style="font-size: clamp(40px, 6vw, 84px)"
                                >
                                    {{ card.front }}
                                </div>
                            </div>
                            <div
                                class="absolute inset-0 flex flex-col items-center justify-center gap-3.5 px-10 text-center"
                                style="backface-visibility: hidden; transform: rotateX(180deg)"
                            >
                                <div class="text-eyebrow uppercase text-pink-soft">Definition</div>
                                <div class="max-w-[40ch] text-[22px] leading-[1.5] text-cream">
                                    {{ card.back }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        class="absolute inset-x-7 bottom-7 flex items-center justify-between"
                    >
                        <button
                            class="rounded-full border border-line-strong px-2.5 py-1 text-[11px] text-cream-dim transition-colors hover:bg-white/[0.03]"
                            @click="flipped = !flipped"
                        >
                            {{ flipped ? 'Show front' : 'Show definition' }} ↺
                        </button>
                        <div class="flex gap-2">
                            <button
                                :disabled="!flipped"
                                :class="ctrlClass('bad')"
                                @click="review('bad')"
                            >
                                Forgot
                            </button>
                            <button
                                :disabled="!flipped"
                                :class="ctrlClass('hard')"
                                @click="review('hard')"
                            >
                                Hard
                            </button>
                            <button
                                :disabled="!flipped"
                                :class="ctrlClass('good')"
                                @click="review('good')"
                            >
                                Easy
                            </button>
                        </div>
                    </div>
                </div>

                <aside class="flex flex-col gap-3.5">
                    <div class="rounded-[20px] border border-line bg-bg-surface p-5">
                        <div class="text-eyebrow uppercase text-cream-faint">Queue</div>
                        <div class="mt-3 flex flex-col gap-2">
                            <div
                                v-for="(c, i) in deck"
                                :key="i"
                                :class="[
                                    'flex items-center gap-2.5 rounded-[10px] border px-2.5 py-2',
                                    isCurrent(i)
                                        ? 'border-pink-soft/30 bg-plum'
                                        : 'border-line',
                                    isDone(i) && !isCurrent(i) ? 'opacity-50' : '',
                                ]"
                            >
                                <span
                                    :class="[
                                        'grid size-4.5 place-items-center rounded-full border border-line-strong text-lavender',
                                        isDone(i) && !isCurrent(i) ? 'bg-lavender-soft' : '',
                                    ]"
                                >
                                    <Check
                                        v-if="isDone(i) && !isCurrent(i)"
                                        class="size-2.5"
                                    />
                                    <span
                                        v-else-if="isCurrent(i)"
                                        class="size-1.5 rounded-full bg-pink-soft"
                                    />
                                </span>
                                <span
                                    :class="[
                                        'text-[13px]',
                                        isCurrent(i) ? 'text-cream' : 'text-cream-dim',
                                    ]"
                                >
                                    {{ c.front }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-[20px] border border-line bg-bg-surface p-5">
                        <div class="text-eyebrow uppercase text-cream-faint">Tip</div>
                        <p class="mt-2.5 text-[13px] leading-[1.55] text-cream-dim">
                            Be honest. "Hard" tells Mnemio to show this one again in a day. "Easy"
                            pushes it to next week.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { SAMPLE_DECK } from '@/composables/useSampleDeck';

type Rating = 'bad' | 'hard' | 'good';

const deck = SAMPLE_DECK;
const idx = ref(0);
const flipped = ref(false);
const history = ref<Rating[]>([]);

const card = computed(() => deck[idx.value % deck.length]!);
const total = computed(() => history.value.length);
const known = computed(() => history.value.filter((r) => r === 'good').length);
const pct = computed(() => (total.value ? Math.round((known.value / total.value) * 100) : 0));

const review = (rating: Rating) => {
    history.value.push(rating);
    flipped.value = false;
    setTimeout(() => (idx.value = idx.value + 1), 250);
};

const reset = () => {
    idx.value = 0;
    flipped.value = false;
    history.value = [];
};

const isCurrent = (i: number) => i === idx.value % deck.length;
const isDone = (i: number) => i < idx.value % deck.length || idx.value >= deck.length;

const ctrlClass = (variant: Rating) =>
    [
        'rounded-full border bg-white/[0.04] px-4 py-2.5 text-[13px] transition-opacity',
        flipped.value ? 'opacity-100' : 'opacity-40',
        variant === 'good'
            ? 'border-success/40 text-success'
            : variant === 'bad'
              ? 'border-pink-soft/40 text-pink-soft'
              : 'border-line-strong text-cream',
    ].join(' ');
</script>
