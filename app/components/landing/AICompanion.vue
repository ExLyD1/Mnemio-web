<template>
    <section id="ai" class="border-t border-line px-8 py-28">
        <div class="mx-auto max-w-[1240px]">
            <div class="grid items-center gap-15 lg:grid-cols-[1.1fr_1fr]">
                <div>
                    <div class="mb-4 flex items-center gap-3">
                        <span class="h-px w-6 bg-lavender" />
                        <span class="text-eyebrow uppercase text-cream-faint">AI Companion</span>
                    </div>
                    <h2
                        class="font-display text-[clamp(34px,4.6vw,60px)] font-light leading-[1.04] tracking-[-0.025em] text-cream"
                    >
                        The card you<br />
                        <em class="not-italic italic text-lavender">can't crack,</em><br />
                        cracked.
                    </h2>
                    <p class="mt-5 max-w-[60ch] text-[18px] leading-[1.6] text-cream-dim">
                        When the same card trips you for three days running, your companion steps
                        in — rewriting the prompt, drafting a mnemonic, or pulling a sentence from
                        a real source. You stay in charge: every change is one tap to accept.
                    </p>
                    <div class="mt-7 flex gap-3">
                        <a
                            href="#"
                            class="inline-flex items-center gap-2 rounded-xl border border-line-strong bg-transparent px-5 py-3 text-small font-semibold text-cream transition-colors hover:border-cream-dim hover:bg-white/[0.03]"
                        >
                            <Sparkles class="size-4" />
                            See sample prompts
                        </a>
                    </div>
                </div>

                <div>
                    <div
                        class="rounded-[20px] border border-line bg-bg-surface p-7 shadow-soft-elevation"
                    >
                        <div
                            class="mb-4 flex items-center gap-2.5 border-b border-line pb-3.5"
                        >
                            <div
                                class="grid size-8 place-items-center rounded-lg bg-plum text-pink-soft"
                            >
                                <Sparkles class="size-3.5" />
                            </div>
                            <div>
                                <div class="text-[14px] font-semibold text-cream">
                                    Mnemio Companion
                                </div>
                                <div class="text-[12px] text-cream-faint">
                                    Working on:
                                    <em class="not-italic font-display text-cream-dim">Sonder</em>
                                    · Vocabulary
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col gap-2.5">
                            <div
                                v-for="(msg, i) in visible"
                                :key="i"
                                :class="[
                                    'max-w-[80%] rounded-2xl px-4 py-3 text-[14px] leading-[1.55]',
                                    msg.from === 'user'
                                        ? 'self-end bg-plum text-cream'
                                        : 'self-start bg-plum-card-back text-cream',
                                ]"
                            >
                                {{ msg.text }}
                            </div>
                            <div
                                v-if="step < turns.length && turns[step]?.from === 'ai'"
                                class="max-w-[80%] self-start rounded-2xl bg-plum-card-back px-4 py-3"
                            >
                                <span class="inline-flex items-end gap-1">
                                    <i
                                        v-for="d in [0, 1, 2]"
                                        :key="d"
                                        class="block size-1.5 rounded-full bg-cream-dim"
                                        :style="{
                                            animation: `typing-dot 1.2s infinite`,
                                            animationDelay: `${d * 0.2}s`,
                                        }"
                                    />
                                </span>
                            </div>
                        </div>

                        <div
                            class="mt-4 flex gap-2 border-t border-line pt-4"
                        >
                            <input
                                placeholder="Ask the companion…"
                                class="flex-1 rounded-[10px] border border-line bg-white/[0.04] px-4 py-2.5 text-[14px] text-cream outline-none placeholder:text-cream-faint"
                            />
                            <UiButton variant="primary" class="!px-3.5 !py-2">
                                <ArrowRight class="size-4" />
                            </UiButton>
                        </div>
                    </div>

                    <div class="mt-3.5 flex justify-end">
                        <button
                            class="rounded-full border border-line-strong px-2.5 py-1 text-[11px] text-cream-dim transition-colors hover:bg-white/[0.03]"
                            @click="reset"
                        >
                            ↺ Replay
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Sparkles, ArrowRight } from 'lucide-vue-next';

interface Turn {
    from: 'user' | 'ai';
    text: string;
}

const turns: Turn[] = [
    { from: 'user', text: "I keep blanking on 'sonder'. Help me lock it in." },
    {
        from: 'ai',
        text: "Sonder is the moment you notice a stranger has a whole inner life. Picture sitting on a train at dusk — every window in the city has its own movie playing. Try this cue: 'sonder = stranger's wonder'.",
    },
    { from: 'user', text: 'Better. Can you rewrite the card?' },
    {
        from: 'ai',
        text: "Done. New front: 'The realization that every passerby has a life as vivid as your own — pictured through a stranger's lit window.' I'll show it to you again tomorrow.",
    },
];

const step = ref(0);
let timer: ReturnType<typeof setTimeout> | null = null;

const visible = computed(() => turns.slice(0, step.value));

const tick = () => {
    if (step.value >= turns.length) return;
    const current = turns[step.value];
    const delay = step.value === 0 ? 600 : current?.from === 'ai' ? 1800 : 1200;
    timer = setTimeout(() => {
        step.value++;
        tick();
    }, delay);
};

const reset = () => {
    if (timer) clearTimeout(timer);
    step.value = 0;
    tick();
};

onMounted(() => tick());
onBeforeUnmount(() => {
    if (timer) clearTimeout(timer);
});
</script>
