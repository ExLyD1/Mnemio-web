<template>
    <div
        class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        aria-atomic="true"
    >
        <TransitionGroup name="toast">
            <div
                v-for="t in toasts"
                :key="t.id"
                :class="[
                    'pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-body shadow-lg',
                    variants[t.variant],
                ]"
                role="status"
            >
                <span>{{ t.message }}</span>
                <button
                    class="text-current/70 hover:text-current"
                    aria-label="Dismiss"
                    @click="dismiss(t.id)"
                >
                    <X class="size-4" />
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

const { toasts, dismiss } = useToast();

const variants = {
    info: 'bg-bg-surface text-brand-pale',
    success: 'bg-brand text-neutral-0',
    error: 'bg-error text-neutral-0',
} as const;
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition: all 200ms ease;
}
.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateY(8px);
}
</style>
