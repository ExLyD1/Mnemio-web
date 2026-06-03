<template>
    <div>
        <section class="border-b border-line bg-mimi-ambient">
            <div class="mx-auto max-w-[720px] px-6 py-16">
                <p class="text-eyebrow uppercase text-brand-pale">Legal</p>
                <h1 class="mt-2 font-display text-display-sm text-cream">{{ title }}</h1>
                <p class="mt-2 text-small text-brand-muted">Last updated {{ updated }}</p>
            </div>
        </section>

        <section class="mx-auto max-w-[720px] px-6 py-14">
            <div
                class="rounded-2xl border border-line border-l-2 border-l-brand-bright bg-bg-surface p-5 text-small text-cream-dim"
            >
                {{ summary }}
            </div>

            <div class="mt-10 flex flex-col gap-10">
                <div v-for="(s, i) in sections" :key="i" class="grid gap-3 sm:grid-cols-[64px_1fr]">
                    <span class="font-display text-3xl text-brand-bright">
                        {{ String(i + 1).padStart(2, '0') }}
                    </span>
                    <div>
                        <h2 class="font-display text-h2 text-cream">{{ s.heading }}</h2>
                        <p class="mt-2 text-body leading-relaxed text-cream-dim">{{ s.body }}</p>
                    </div>
                </div>
            </div>

            <div class="mt-12 border-t border-line pt-6">
                <p class="font-display text-h3 text-cream">Questions?</p>
                <p class="mt-1 text-body text-cream-dim">
                    Email us at
                    <a href="mailto:hello@mnemio.app" class="text-accent hover:underline">
                        hello@mnemio.app </a
                    >.
                </p>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
interface Section {
    heading: string;
    body: string;
}

defineProps<{ title: string; updated: string; summary: string; sections: Section[] }>();
</script>
