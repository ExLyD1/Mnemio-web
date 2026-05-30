<template>
    <section class="px-8 py-28 text-center">
        <div class="mx-auto max-w-[1240px]">
            <div class="mb-4 flex items-center justify-center gap-3">
                <span class="h-px w-6 bg-lavender" />
                <span class="text-eyebrow uppercase text-cream-faint">Start tonight</span>
                <span class="h-px w-6 bg-lavender" />
            </div>
            <h2
                class="font-display text-[clamp(34px,4.6vw,60px)] font-light leading-[1.04] tracking-[-0.025em] text-cream"
            >
                Your future self<br />will thank you for
                <em class="not-italic italic text-lavender">five quiet minutes</em>.
            </h2>
            <p class="mx-auto mt-5 max-w-[52ch] text-[18px] text-cream-dim">
                Free for personal use. No credit card. Your decks are yours — export anytime.
            </p>
            <div class="mt-7 flex justify-center gap-3">
                <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                    Create your first deck
                    <ArrowRight class="size-4" />
                </UiButton>
                <a
                    href="#"
                    class="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-transparent px-5 py-3 text-small font-semibold text-cream transition-colors hover:border-cream-dim hover:bg-white/[0.03]"
                >
                    Browse community decks
                </a>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
</script>
