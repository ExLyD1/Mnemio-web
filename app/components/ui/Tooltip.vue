<template>
    <span
        class="relative inline-flex"
        @mouseenter="show = true"
        @mouseleave="show = false"
        @focusin="show = true"
        @focusout="show = false"
    >
        <slot />
        <Transition name="tip">
            <span
                v-if="show && content"
                :class="[
                    'pointer-events-none absolute z-40 whitespace-nowrap rounded-lg border border-line-strong bg-bg-well px-2.5 py-1.5 text-small text-cream shadow-soft-elevation',
                    sides[side],
                ]"
                role="tooltip"
            >
                {{ content }}
            </span>
        </Transition>
    </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ content?: string; side?: 'top' | 'bottom' | 'left' | 'right' }>(), {
    content: '',
    side: 'top',
});

const show = ref(false);

const sides = {
    top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
    bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
    left: 'right-full top-1/2 mr-2 -translate-y-1/2',
    right: 'left-full top-1/2 ml-2 -translate-y-1/2',
} as const;
</script>

<style scoped>
.tip-enter-active,
.tip-leave-active {
    transition: opacity 0.14s ease;
}
.tip-enter-from,
.tip-leave-to {
    opacity: 0;
}
</style>
