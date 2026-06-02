<template>
    <div>
        <section class="border-b border-line bg-mimi-ambient">
            <div
                class="mx-auto flex max-w-[1080px] flex-col items-center gap-6 px-6 py-20 text-center sm:flex-row sm:text-left"
            >
                <div class="flex-1">
                    <p class="text-eyebrow uppercase text-brand-pale">About Mnemio</p>
                    <h1 class="mt-2 font-display text-display-sm text-cream">
                        Learn it once. <span class="italic">Remember it for good.</span>
                    </h1>
                    <p class="mt-3 max-w-[48ch] text-body text-cream-dim">
                        Mnemio pairs spaced repetition with a friendly companion so vocabulary
                        sticks without the cram-and-forget cycle.
                    </p>
                </div>
                <SharedMimi :size="150" />
            </div>
        </section>

        <section class="mx-auto max-w-[1080px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">Our mission</p>
            <h2 class="mt-2 max-w-[24ch] font-display text-h1 text-cream">
                Make durable memory feel effortless and a little bit joyful.
            </h2>
            <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="v in values"
                    :key="v.title"
                    class="rounded-[20px] border border-line border-l-2 border-l-brand-bright bg-bg-surface p-6 transition-transform hover:-translate-y-0.5"
                >
                    <h3 class="font-display text-h3 text-cream">{{ v.title }}</h3>
                    <p class="mt-2 text-small text-cream-dim">{{ v.body }}</p>
                </div>
            </div>
        </section>

        <section class="mx-auto max-w-[1080px] px-6 pb-16">
            <p class="text-eyebrow uppercase text-brand-muted">Built with</p>
            <div class="mt-4 flex flex-wrap gap-2">
                <SharedPill v-for="tech in stack" :key="tech" tone="plum">{{ tech }}</SharedPill>
            </div>
        </section>

        <section class="border-t border-line">
            <div class="mx-auto max-w-[1080px] px-6 py-20 text-center">
                <h2 class="font-display text-h1 text-cream">
                    Start remembering more, <span class="italic">today.</span>
                </h2>
                <div class="mt-6 flex justify-center gap-3">
                    <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                        Get started
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
definePageMeta({ layout: 'marketing' });

const values = [
    { title: 'Calm by design', body: 'No streak guilt-trips. Just steady, sustainable progress.' },
    {
        title: 'Science-backed',
        body: 'A proven SM-2 spaced-repetition core schedules every review.',
    },
    { title: 'Bring your own words', body: 'Build decks from the vocabulary you actually need.' },
    { title: 'AI that helps', body: 'Mimi drafts cards and nudges you toward what to revisit.' },
    { title: 'Yours, always', body: 'Your decks and progress belong to you — export anytime.' },
    { title: 'Delightfully small', body: 'A focused tool that does one thing exceptionally well.' },
];

const stack = ['Nuxt 4', 'Vue 3', 'TypeScript', 'Tailwind CSS', 'Pinia', 'Zod'];
</script>
