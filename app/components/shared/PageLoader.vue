<template>
    <div class="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <img
            src="/images/mimi/axolotl.png"
            alt=""
            class="loader-bob size-16 select-none drop-shadow-[0_12px_18px_rgba(0,0,0,0.4)]"
            draggable="false"
        />
        <div class="flex items-center gap-1.5">
            <span class="size-2 animate-typing-dot rounded-full bg-lavender" />
            <span
                class="size-2 animate-typing-dot rounded-full bg-lavender [animation-delay:0.2s]"
            />
            <span
                class="size-2 animate-typing-dot rounded-full bg-lavender [animation-delay:0.4s]"
            />
        </div>
        <p v-if="label" class="text-small text-brand-muted">{{ label }}</p>
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: '' });
</script>

<style scoped>
@keyframes loader-bob {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-6px);
    }
}
.loader-bob {
    animation: loader-bob 1.8s ease-in-out infinite;
}
</style>
