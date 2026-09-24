<template>
    <div
        class="toast-stack pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2.5 px-4 md:inset-x-auto md:bottom-6 md:right-6 md:top-auto md:items-end md:px-0"
        aria-live="polite"
        aria-atomic="true"
    >
        <TransitionGroup name="toast">
            <div
                v-for="toast in toasts"
                :key="toast.id"
                class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[22px] border border-line bg-bg-surface py-2.5 pl-2.5 pr-2 text-cream shadow-float"
                :role="toast.variant === 'error' ? 'alert' : 'status'"
            >
                <span
                    :class="[
                        'grid size-10 shrink-0 place-items-center rounded-full',
                        bubbles[toast.variant],
                    ]"
                    aria-hidden="true"
                >
                    <span
                        v-if="toast.variant === 'achievement'"
                        class="trophy text-xl leading-none"
                    >
                        🏆
                    </span>
                    <component :is="icons[toast.variant]" v-else class="size-[18px]" />
                </span>

                <div class="min-w-0 flex-1 py-0.5">
                    <p v-if="toast.title" class="text-small font-semibold text-cream-dim">
                        {{ toast.title }}
                    </p>
                    <p
                        :class="[
                            'text-[15px] leading-snug',
                            toast.variant === 'achievement' ? 'font-semibold' : '',
                        ]"
                    >
                        {{ toast.message }}
                    </p>
                </div>

                <button
                    class="grid size-7 shrink-0 place-items-center self-start rounded-full text-cream-faint transition-colors hover:bg-bg-surface-2 hover:text-cream"
                    :aria-label="t('toast.dismiss')"
                    @click="dismiss(toast.id)"
                >
                    <X class="size-3.5" />
                </button>
            </div>
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import { Cloud, Heart, Sparkles, X } from 'lucide-vue-next';
import { useToast, type ToastVariant } from '@/composables/useToast';
import { useT } from '@/composables/useT';

const { toasts, dismiss } = useToast();
const { t } = useT();

const icons = {
    info: Heart,
    success: Sparkles,
    error: Cloud,
    achievement: Sparkles,
} as const satisfies Record<ToastVariant, unknown>;

const bubbles: Record<ToastVariant, string> = {
    info: 'bg-purple-soft text-purple',
    success: 'bg-success/15 text-success',
    error: 'bg-error/15 text-error',
    achievement: 'bg-pink/30',
};
</script>

<style scoped>
/* Top of the screen on mobile so toasts never cover the bottom tab bar. */
.toast-stack {
    top: max(0.75rem, env(safe-area-inset-top));
}
@media (min-width: 768px) {
    .toast-stack {
        top: auto;
    }
}

.toast-enter-active {
    transition:
        opacity 260ms ease-out,
        transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
    transition:
        opacity 200ms ease-in,
        transform 200ms ease-in;
}
.toast-move {
    transition: transform 300ms ease;
}
.toast-enter-from {
    opacity: 0;
    transform: translateY(-10px) scale(0.94);
}
.toast-leave-to {
    opacity: 0;
    transform: scale(0.96);
}
@media (min-width: 768px) {
    .toast-enter-from {
        transform: translateY(10px) scale(0.94);
    }
}

.trophy {
    display: inline-block;
    animation: trophy-wiggle 900ms ease-in-out 250ms 1;
}
@keyframes trophy-wiggle {
    0%,
    100% {
        transform: rotate(0) scale(1);
    }
    25% {
        transform: rotate(-12deg) scale(1.12);
    }
    50% {
        transform: rotate(10deg) scale(1.12);
    }
    75% {
        transform: rotate(-5deg) scale(1.05);
    }
}

@media (prefers-reduced-motion: reduce) {
    .toast-enter-active,
    .toast-leave-active,
    .toast-move {
        transition: opacity 150ms linear;
    }
    .toast-enter-from,
    .toast-leave-to {
        transform: none;
    }
    .trophy {
        animation: none;
    }
}
</style>
