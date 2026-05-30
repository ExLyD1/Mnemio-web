<template>
    <section id="how" class="px-8 py-28">
        <div class="mx-auto max-w-[1240px]">
            <div class="mb-4 flex items-center gap-3">
                <span class="h-px w-6 bg-lavender" />
                <span class="text-eyebrow uppercase text-cream-faint">How it works</span>
            </div>

            <h2
                class="max-w-[20ch] font-display text-[clamp(34px,4.6vw,60px)] font-light leading-[1.04] tracking-[-0.025em] text-cream"
            >
                Three minutes from blank page<br />to your first review.
            </h2>

            <div
                class="mt-14 grid border-y border-line md:grid-cols-3"
            >
                <div
                    v-for="(step, i) in steps"
                    :key="step.title"
                    :class="[
                        'flex min-h-[280px] flex-col gap-3.5 p-9',
                        i < steps.length - 1 ? 'md:border-r md:border-line' : '',
                        i < steps.length - 1 ? 'border-b border-line md:border-b-0' : '',
                    ]"
                >
                    <div class="font-display text-[64px] font-light leading-none text-lavender/80">
                        {{ step.num }}
                    </div>
                    <h3 class="text-[22px] font-semibold text-cream">{{ step.title }}</h3>
                    <p class="m-0 text-[15px] leading-[1.55] text-cream-dim">{{ step.body }}</p>
                    <div class="mt-auto flex items-center gap-1.5 text-[13px] text-cream-faint">
                        <component :is="step.icon" class="size-3.5" />
                        {{ step.footnote }}
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Layers, Clock, Sparkles } from 'lucide-vue-next';

const steps = [
    {
        num: '01',
        title: 'Make a deck',
        body: 'Name it, give it a subject, and pick a card type — basic, cloze, or image. Or paste a source and let Mnemio draft it.',
        icon: Layers,
        footnote: 'Avg. 90s to set up',
    },
    {
        num: '02',
        title: 'Practice daily',
        body: 'Five minutes is enough. Mnemio shows you exactly which cards are due, in the order most likely to break before tomorrow.',
        icon: Clock,
        footnote: '5–15 min sessions',
    },
    {
        num: '03',
        title: 'Let the AI help',
        body: 'Stuck on the same card three days running? Ask the companion. It rewrites the cue, gives you a mnemonic, or finds a sentence in the wild.',
        icon: Sparkles,
        footnote: 'Free for the first 100 prompts',
    },
];
</script>
