<template>
    <section class="relative overflow-hidden px-8 pb-10 pt-16">
        <div
            class="mx-auto grid max-w-[1240px] items-center gap-15 lg:grid-cols-[1.15fr_1fr]"
        >
            <div>
                <span
                    class="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.02] px-3 py-1.5 pl-2 text-small text-cream-dim"
                >
                    <span class="size-1.5 rounded-full bg-lavender shadow-[0_0_10px_#A98EE3]" />
                    Now with AI companion · v1.4
                </span>

                <h1
                    class="mt-5 font-display text-[clamp(48px,7.4vw,104px)] font-light leading-[0.96] tracking-[-0.03em] text-cream"
                >
                    Remember<br />
                    <span class="italic text-lavender">anything</span>,<br />
                    forget <span class="relative inline-block text-cream-dim">cramming
                        <span
                            class="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rotate-[-3deg] bg-plum"
                        /></span>.
                </h1>

                <p class="mt-7 max-w-[52ch] text-[19px] leading-[1.55] text-cream-dim">
                    Mnemio builds spaced-repetition decks around the way memory actually works —
                    and uses an AI companion to coach you through the cards that won't stick.
                </p>

                <div class="mt-9 flex flex-wrap gap-3">
                    <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                        Start a free deck
                        <ArrowRight class="size-4" />
                    </UiButton>
                    <a
                        href="#demo"
                        class="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-transparent px-5 py-3 text-small font-semibold text-cream transition-colors hover:border-cream-dim hover:bg-white/[0.03]"
                    >
                        See it in action
                    </a>
                </div>

                <div class="mt-9 flex flex-wrap gap-8 text-small text-cream-faint">
                    <div v-for="stat in stats" :key="stat.label">
                        <b class="block font-display text-[22px] font-normal text-cream">
                            {{ stat.value }}
                        </b>
                        <span>{{ stat.label }}</span>
                    </div>
                </div>
            </div>

            <LandingFlashCard :deck="SAMPLE_DECK" />
        </div>
    </section>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import { SAMPLE_DECK } from '@/composables/useSampleDeck';

const stats = [
    { value: '14k+', label: 'learners studying daily' },
    { value: '2.3M', label: 'cards reviewed' },
    { value: '92%', label: '30-day recall' },
];
</script>
