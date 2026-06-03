<template>
    <div>
        <!-- Hero -->
        <section class="mx-auto grid max-w-[1080px] items-center gap-10 px-6 py-20 lg:grid-cols-2">
            <div>
                <SharedPill tone="plum">
                    <Star class="size-3.5 fill-pink-soft text-pink-soft" />
                    Loved by 240,000 learners
                </SharedPill>
                <h1 class="mt-5 font-display text-display text-cream">
                    Turn new words into <span class="italic">lasting</span> memory.
                </h1>
                <p class="mt-5 max-w-[46ch] text-body text-cream-dim">
                    Mnemio schedules every review at the perfect moment and gives you a friendly
                    companion to keep you going. Learn it once — remember it for good.
                </p>
                <div class="mt-7 flex flex-wrap gap-3">
                    <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                        Get started free
                    </UiButton>
                    <UiButton variant="ghost" @click="scrollTo('#how')">See how it works</UiButton>
                </div>
            </div>

            <div class="relative grid place-items-center py-8">
                <div class="card-stack relative h-[260px] w-[320px]">
                    <div
                        v-for="(c, i) in heroCards"
                        :key="i"
                        class="absolute inset-0 flex flex-col justify-between rounded-2xl border border-line-strong bg-plum-card p-6 shadow-flash-card"
                        :style="stackStyle(i)"
                    >
                        <SharedPill tone="plum">{{ c.lang }}</SharedPill>
                        <p class="font-display text-3xl text-cream">{{ c.front }}</p>
                        <span class="text-small text-brand-muted">{{ c.tag }}</span>
                    </div>
                </div>
                <SharedMimi :size="120" class="absolute -bottom-2 -right-2" />
            </div>
        </section>

        <!-- Features -->
        <section id="features" class="mx-auto max-w-[1080px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">Why Mnemio</p>
            <h2 class="mt-2 max-w-[20ch] font-display text-h1 text-cream">
                Everything you need to remember more.
            </h2>
            <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="f in features"
                    :key="f.title"
                    class="rounded-[20px] border border-line bg-bg-surface p-6 transition-transform hover:-translate-y-0.5"
                >
                    <span
                        class="grid size-11 place-items-center rounded-xl bg-brand/30 text-lavender"
                    >
                        <component :is="f.icon" class="size-5" />
                    </span>
                    <h3 class="mt-4 font-display text-h3 text-cream">{{ f.title }}</h3>
                    <p class="mt-2 text-small text-cream-dim">{{ f.body }}</p>
                </div>
            </div>
        </section>

        <!-- How it works -->
        <section id="how" class="mx-auto max-w-[1080px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">How it works</p>
            <h2 class="mt-2 font-display text-h1 text-cream">Three steps to durable memory.</h2>
            <div class="mt-10 grid gap-5 sm:grid-cols-3">
                <div
                    v-for="(s, i) in steps"
                    :key="s.title"
                    class="rounded-[20px] border border-line bg-bg-surface p-6"
                >
                    <span class="font-display text-4xl text-brand-bright">{{ i + 1 }}</span>
                    <h3 class="mt-3 font-display text-h3 text-cream">{{ s.title }}</h3>
                    <p class="mt-2 text-small text-cream-dim">{{ s.body }}</p>
                </div>
            </div>
        </section>

        <!-- Interactive demo -->
        <section id="demo" class="border-y border-line bg-bg-surface/40">
            <div class="mx-auto max-w-[1080px] px-6 py-16">
                <div class="mb-8 text-center">
                    <p class="text-eyebrow uppercase text-brand-muted">Try a card</p>
                    <h2 class="mt-2 font-display text-h1 text-cream">Feel the flow.</h2>
                </div>
                <LandingDemo />
            </div>
        </section>

        <!-- AI companion -->
        <section
            id="ai"
            class="mx-auto grid max-w-[1080px] items-center gap-10 px-6 py-16 lg:grid-cols-2"
        >
            <div>
                <p class="text-eyebrow uppercase text-brand-muted">Meet Mimi</p>
                <h2 class="mt-2 font-display text-h1 text-cream">
                    A companion that actually helps.
                </h2>
                <p class="mt-4 max-w-[44ch] text-body text-cream-dim">
                    Mimi drafts cards from your notes, points out what you keep forgetting, and
                    cheers you on — without the guilt-trips.
                </p>
            </div>
            <div class="flex flex-col gap-3 rounded-[20px] border border-line bg-bg-surface p-6">
                <div
                    class="max-w-[80%] self-start rounded-2xl rounded-bl-sm border border-line-strong bg-bg-surface-2 px-4 py-3 text-body text-cream"
                >
                    You forgot “saudade” twice. Want to drill it now?
                </div>
                <div
                    class="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-brand px-4 py-3 text-body text-cream"
                >
                    Yes please!
                </div>
                <div class="flex items-center gap-2 self-start text-small text-brand-muted">
                    <span class="size-1.5 animate-typing-dot rounded-full bg-brand-pale" />
                    <span
                        class="size-1.5 animate-typing-dot rounded-full bg-brand-pale [animation-delay:0.2s]"
                    />
                    <span
                        class="size-1.5 animate-typing-dot rounded-full bg-brand-pale [animation-delay:0.4s]"
                    />
                </div>
            </div>
        </section>

        <!-- Stats -->
        <section class="mx-auto max-w-[1080px] px-6 py-12">
            <div
                class="grid grid-cols-2 gap-6 rounded-[20px] border border-line bg-bg-surface p-8 sm:grid-cols-4"
            >
                <div v-for="s in stats" :key="s.label" class="text-center">
                    <p class="font-display text-h1 text-cream">{{ s.value }}</p>
                    <p class="mt-1 text-small text-brand-muted">{{ s.label }}</p>
                </div>
            </div>
        </section>

        <!-- Final CTA -->
        <section class="mx-auto max-w-[1080px] px-6 pb-24 pt-10">
            <div class="rounded-[28px] bg-mimi-ambient p-12 text-center">
                <h2 class="font-display text-display-sm text-cream">
                    Start remembering more, <span class="italic">today.</span>
                </h2>
                <p class="mx-auto mt-3 max-w-[44ch] text-body text-cream-dim">
                    Free to start. Bring your own words and let Mnemio do the scheduling.
                </p>
                <div class="mt-6 flex justify-center gap-3">
                    <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                        Get started free
                    </UiButton>
                    <UiButton variant="ghost" @click="navigateTo('/discover')">
                        Explore decks
                    </UiButton>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { Star, Upload, Wand2, Brain, Image, Flame, WifiOff } from 'lucide-vue-next';
import { SAMPLE_DECK } from '@/composables/useSampleDeck';

definePageMeta({ layout: 'marketing' });

const heroCards = SAMPLE_DECK.slice(0, 3);

const stackStyle = (i: number) => ({
    transform: `translateY(${i * -14}px) translateX(${i * 10}px) rotate(${(i - 1) * 4}deg)`,
    zIndex: String(heroCards.length - i),
    opacity: String(1 - i * 0.12),
});

const features = [
    {
        icon: Upload,
        title: 'Bring your own deck',
        body: 'Import or type the exact words you need to learn.',
    },
    {
        icon: Wand2,
        title: 'AI-drafted cards',
        body: 'Mimi turns a topic or note into a ready-to-study deck.',
    },
    {
        icon: Brain,
        title: 'Spaced repetition',
        body: 'A proven SM-2 core schedules every review for you.',
    },
    {
        icon: Image,
        title: 'Image & cloze',
        body: 'Picture prompts and fill-the-gap cards, coming soon.',
    },
    {
        icon: Flame,
        title: 'Streaks that bend',
        body: 'Gentle momentum without the all-or-nothing guilt.',
    },
    {
        icon: WifiOff,
        title: 'Yours, anywhere',
        body: 'Your decks and progress belong to you — export anytime.',
    },
];

const steps = [
    { title: 'Add your words', body: 'Create a deck and drop in the vocabulary you care about.' },
    { title: 'Let AI build it', body: 'Mimi fills in meanings and examples so you don’t have to.' },
    { title: 'Study & track', body: 'Review at the right moment and watch mastery climb.' },
];

const stats = [
    { value: '240K', label: 'Active learners' },
    { value: '1.2B', label: 'Cards reviewed' },
    { value: '34', label: 'Languages' },
    { value: '94%', label: 'Avg. retention' },
];

const scrollTo = (sel: string) => {
    document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' });
};
</script>

<style scoped>
@keyframes floaty {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10px);
    }
}
.card-stack > div:first-child {
    animation: floaty 5s ease-in-out infinite;
}
</style>
