<template>
    <div class="stage" @click="markTouched">
        <div :class="['deck', flipped ? 'flipped' : '']">
            <div class="card stack-2">
                <div class="face front">
                    <div class="label">{{ next2.tag }}</div>
                    <div class="word">{{ next2.front }}</div>
                    <div class="meta">{{ next2.lang }}</div>
                </div>
            </div>
            <div class="card stack-1">
                <div class="face front">
                    <div class="label">{{ next1.tag }}</div>
                    <div class="word">{{ next1.front }}</div>
                    <div class="meta">{{ next1.lang }}</div>
                </div>
            </div>
            <div class="card stack-0" @click.stop="toggle">
                <div class="face front">
                    <div class="label">{{ current.tag }}</div>
                    <div class="word">{{ current.front }}</div>
                    <div class="meta flex items-center justify-between">
                        <span>{{ current.lang }}</span>
                        <span class="text-cream-faint">Tap to flip ↺</span>
                    </div>
                </div>
                <div class="face back">
                    <div class="label">Definition</div>
                    <div class="word back-word">{{ current.back }}</div>
                    <div class="meta">{{ current.lang }}</div>
                </div>
            </div>
        </div>

        <div class="controls">
            <button class="ctrl bad" @click="advance">Don't know</button>
            <button class="ctrl" @click="advance">Hard</button>
            <button class="ctrl good" @click="advance">I knew it</button>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Card {
    front: string;
    back: string;
    lang: string;
    tag: string;
}

const props = defineProps<{ deck: Card[] }>();

const idx = ref(0);
const flipped = ref(false);
const touched = ref(false);
let autoTimer: ReturnType<typeof setTimeout> | null = null;

const at = (n: number) => props.deck[((idx.value + n) % props.deck.length + props.deck.length) % props.deck.length]!;

const current = computed(() => at(0));
const next1 = computed(() => at(1));
const next2 = computed(() => at(2));

const markTouched = () => {
    touched.value = true;
};

const toggle = () => {
    touched.value = true;
    flipped.value = !flipped.value;
};

const advance = () => {
    flipped.value = false;
    setTimeout(() => (idx.value = idx.value + 1), 200);
};

const scheduleAutoFlip = () => {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
        if (!touched.value) flipped.value = !flipped.value;
    }, 2200);
};

watch([flipped, idx], () => scheduleAutoFlip(), { immediate: true });

onBeforeUnmount(() => {
    if (autoTimer) clearTimeout(autoTimer);
});
</script>

<style scoped>
.stage {
    position: relative;
    height: 540px;
    perspective: 1600px;
}
.deck {
    position: absolute;
    inset: 0;
}
.card {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 360px;
    height: 460px;
    border-radius: 24px;
    padding: 0;
    transform-style: preserve-3d;
    transition:
        transform 0.9s cubic-bezier(0.6, 0.1, 0.3, 1),
        opacity 0.5s ease;
}
.card .face {
    position: absolute;
    inset: 0;
    padding: 32px 30px;
    border-radius: 24px;
    backface-visibility: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border: 1px solid rgba(227, 210, 200, 0.18);
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.4);
}
.card .front {
    background: linear-gradient(160deg, #2c1a2a 0%, #1a1020 100%);
}
.card .back {
    background: linear-gradient(160deg, #572f54 0%, #482b5c 100%);
    transform: rotateY(180deg);
}
.label {
    font-size: 12px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(227, 210, 200, 0.42);
    font-weight: 600;
}
.word {
    font-family: 'Fraunces', serif;
    font-weight: 400;
    font-size: 48px;
    line-height: 1.05;
    color: #e3d2c8;
}
.back-word {
    font-size: 28px;
    line-height: 1.25;
}
.meta {
    font-size: 13px;
    color: rgba(227, 210, 200, 0.62);
}
.stack-0 {
    transform: translate(-50%, -50%) rotate(2deg);
    z-index: 3;
    cursor: pointer;
}
.stack-1 {
    transform: translate(-50%, -50%) translateY(20px) translateX(-26px) rotate(-5deg) scale(0.94);
    z-index: 2;
    opacity: 0.75;
}
.stack-2 {
    transform: translate(-50%, -50%) translateY(36px) translateX(28px) rotate(7deg) scale(0.88);
    z-index: 1;
    opacity: 0.5;
}
.flipped .stack-0 {
    transform: translate(-50%, -50%) rotate(2deg) rotateY(180deg);
}
.controls {
    position: absolute;
    bottom: 8px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    gap: 8px;
    z-index: 10;
}
.ctrl {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(227, 210, 200, 0.18);
    color: #e3d2c8;
    padding: 10px 16px;
    border-radius: 999px;
    font-size: 13px;
    transition: background 0.15s;
}
.ctrl:hover {
    background: rgba(255, 255, 255, 0.08);
}
.ctrl.good {
    color: #a6c261;
    border-color: rgba(166, 194, 97, 0.4);
}
.ctrl.bad {
    color: #f2bcff;
    border-color: rgba(242, 188, 255, 0.4);
}
</style>
