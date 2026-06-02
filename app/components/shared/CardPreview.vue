<template>
    <div class="w-full" style="perspective: 1400px">
        <div
            class="preview relative mx-auto aspect-[5/6.4] w-full max-w-xs cursor-pointer shadow-card-preview"
            :class="{ flipped }"
            role="button"
            tabindex="0"
            @click="flipped = !flipped"
            @keydown.space.prevent="flipped = !flipped"
        >
            <div class="face front">
                <span class="text-eyebrow uppercase text-brand-muted">Front</span>
                <p class="font-display text-3xl text-cream">{{ front || 'Your word…' }}</p>
                <span class="text-small text-brand-muted">Tap to flip</span>
            </div>
            <div class="face back">
                <span class="text-eyebrow uppercase text-pink-soft">Meaning</span>
                <p class="text-lg leading-snug text-cream">{{ back || 'The meaning…' }}</p>
                <div v-if="tags?.length" class="flex flex-wrap justify-center gap-1.5">
                    <SharedPill v-for="tag in tags" :key="tag" tone="plum">{{ tag }}</SharedPill>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{ front: string; back: string; tags?: string[] }>();

const flipped = ref(false);
</script>

<style scoped>
.preview {
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.25, 1);
    border-radius: 20px;
}
.preview.flipped {
    transform: rotateY(180deg);
}
.face {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 28px;
    border-radius: 20px;
    text-align: center;
    backface-visibility: hidden;
}
.front {
    background: #1a1520;
    border: 1.5px solid rgba(124, 69, 118, 0.45);
}
.back {
    background: linear-gradient(165deg, #20182a, #1a1520);
    border: 1.5px solid #7c4576;
    transform: rotateY(180deg);
}
</style>
