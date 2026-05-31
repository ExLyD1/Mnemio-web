<template>
    <section class="border-t border-line px-8 py-28">
        <div class="mx-auto max-w-[1240px]">
            <div class="mb-4 flex items-center gap-3">
                <span class="h-px w-6 bg-lavender" />
                <span class="text-eyebrow uppercase text-cream-faint">What's inside</span>
            </div>

            <h2
                class="max-w-[18ch] font-display text-[clamp(34px,4.6vw,60px)] font-light leading-[1.04] tracking-[-0.025em] text-cream"
            >
                Built for the long game,<br />not the cram session.
            </h2>

            <div class="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="item in items"
                    :key="item.title"
                    class="flex min-h-[240px] flex-col gap-3.5 rounded-[20px] border border-line bg-bg-surface p-7 transition-all hover:-translate-y-0.5 hover:border-line-strong"
                >
                    <div
                        class="grid size-9 place-items-center rounded-[10px] bg-lavender-soft text-lavender"
                    >
                        <component :is="item.icon" class="size-4" />
                    </div>
                    <h3 class="text-[22px] font-semibold leading-tight text-cream">
                        {{ item.title }}
                    </h3>
                    <p class="m-0 text-[15px] leading-[1.55] text-cream-dim">{{ item.body }}</p>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Layers, Sparkles, Shuffle, Image as ImageIcon, Flame, Globe } from 'lucide-vue-next';

const items = [
    {
        icon: Layers,
        title: 'Bring your own deck',
        body: 'Import from CSV, Anki, or paste a list of terms. Mnemio formats and tags them automatically.',
    },
    {
        icon: Sparkles,
        title: 'AI-drafted cards',
        body: 'Paste a chapter, a transcript, or a PDF. Mnemio drafts well-formed cards you can edit before they enter rotation.',
    },
    {
        icon: Shuffle,
        title: 'Spaced repetition',
        body: 'A per-card SM-2 schedule tuned by your real recall — not by a default that ignores your week.',
    },
    {
        icon: ImageIcon,
        title: 'Image & cloze',
        body: 'Front/back, cloze deletion, occlusion on diagrams. The kind of cards medical and language learners actually need.',
    },
    {
        icon: Flame,
        title: 'Streaks that bend',
        body: 'Honest streaks with two weekly "rest days" baked in. Skip a Sunday without losing momentum.',
    },
    {
        icon: Globe,
        title: 'Works offline',
        body: 'Cards cache locally. Review on a plane, sync the answers when you land.',
    },
];
</script>
