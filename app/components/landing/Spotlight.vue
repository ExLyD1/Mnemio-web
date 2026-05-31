<template>
    <section id="features" class="px-8 py-28">
        <div class="mx-auto max-w-[1240px]">
            <div class="mb-4 flex items-center gap-3">
                <span class="h-px w-6 bg-lavender" />
                <span class="text-eyebrow uppercase text-cream-faint">
                    A studio for your memory
                </span>
            </div>

            <div class="grid items-center gap-15 lg:grid-cols-[1fr_1.1fr]">
                <div>
                    <h2
                        class="font-display text-[clamp(34px,4.6vw,60px)] font-light leading-[1.04] tracking-[-0.025em] text-cream"
                    >
                        A workspace that<br />knows what you're<br />
                        <em class="not-italic italic text-lavender">about to forget.</em>
                    </h2>
                    <p class="mt-5 max-w-[60ch] text-[18px] leading-[1.6] text-cream-dim">
                        Mnemio learns the rhythm of your recall. Cards you nail drop into long-term
                        rotation. Cards you fumble come back tomorrow — and the day after — until
                        they don't.
                    </p>
                    <div class="mt-7 flex flex-col gap-2.5">
                        <div
                            v-for="t in checklist"
                            :key="t"
                            class="flex items-center gap-2.5 text-cream-dim"
                        >
                            <span
                                class="grid size-4.5 place-items-center rounded-full bg-lavender-soft text-lavender"
                            >
                                <Check class="size-3" />
                            </span>
                            {{ t }}
                        </div>
                    </div>
                </div>

                <LandingAppPreview />
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next';

const checklist = [
    'Adaptive interval scheduling, per-card',
    'Daily streaks that respect your timezone',
    'Decks sync across web, iOS, and Android',
];
</script>
