<template>
    <div
        v-if="placement !== 'hidden'"
        class="flex items-end gap-3"
        :class="placement === 'left' ? 'flex-row' : 'flex-row-reverse'"
    >
        <Transition name="mimi-bubble">
            <div
                v-if="message"
                class="max-w-[16rem] rounded-2xl border border-line-strong bg-bg-surface px-4 py-3 text-body leading-snug text-cream shadow-soft-elevation"
            >
                {{ message }}
            </div>
        </Transition>
        <img
            :src="src"
            alt="Mimi"
            :width="size"
            :height="size"
            :style="{ width: `${size}px` }"
            class="select-none drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"
            :class="popping ? 'mimi-pop' : bob ? 'mimi-bob' : ''"
            draggable="false"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { MimiMood, MimiPlacement } from '@/types/mimi';

const props = withDefaults(
    defineProps<{
        message?: string;
        mood?: MimiMood;
        placement?: MimiPlacement;
        size?: number;
        bob?: boolean;
        src?: string;
    }>(),
    {
        message: '',
        mood: 'idle',
        placement: 'right',
        size: 120,
        bob: true,
        src: '/images/mimi/axolotl.png',
    },
);

const popping = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

watch(
    () => props.mood,
    () => {
        popping.value = true;
        clearTimeout(timer);
        timer = setTimeout(() => (popping.value = false), 460);
    },
);
</script>

<style scoped>
@keyframes mimiBob {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-7px);
    }
}
.mimi-bob {
    animation: mimiBob 4.6s ease-in-out infinite;
}
@keyframes mimiPop {
    0% {
        transform: scale(1) rotate(0deg);
    }
    40% {
        transform: scale(1.08) rotate(-3deg);
    }
    100% {
        transform: scale(1) rotate(0deg);
    }
}
.mimi-pop {
    animation: mimiPop 0.42s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
.mimi-bubble-enter-active,
.mimi-bubble-leave-active {
    transition:
        opacity 0.34s ease,
        transform 0.34s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
.mimi-bubble-enter-from,
.mimi-bubble-leave-to {
    opacity: 0;
    transform: translateY(6px) scale(0.96);
}
</style>
