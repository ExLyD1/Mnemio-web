<template>
    <Teleport to="body">
        <Transition name="modal">
            <div
                v-if="modelValue"
                class="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
                role="dialog"
                aria-modal="true"
                :aria-labelledby="titleId"
                @click.self="onBackdrop"
                @keydown.esc="close"
                @keydown.tab="onTab"
            >
                <div
                    ref="panel"
                    tabindex="-1"
                    :class="[
                        'w-full rounded-2xl bg-bg-surface p-6 text-brand-pale shadow-xl outline-none',
                        sizes[size],
                    ]"
                >
                    <header
                        v-if="title || $slots.header"
                        class="mb-4 flex items-start justify-between gap-4"
                    >
                        <div>
                            <h2 v-if="title" :id="titleId" class="text-h3 font-bold text-neutral-0">
                                {{ title }}
                            </h2>
                            <slot name="header" />
                        </div>
                        <button
                            v-if="dismissible"
                            type="button"
                            class="rounded-md p-1 text-brand-muted transition-colors hover:text-brand-pale"
                            aria-label="Close"
                            @click="close"
                        >
                            <X class="size-5" />
                        </button>
                    </header>
                    <div class="text-body">
                        <slot />
                    </div>
                    <footer v-if="$slots.footer" class="mt-6 flex justify-end gap-2">
                        <slot name="footer" />
                    </footer>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';

const props = withDefaults(
    defineProps<{
        modelValue: boolean;
        title?: string;
        dismissible?: boolean;
        closeOnBackdrop?: boolean;
        size?: 'sm' | 'md' | 'lg';
    }>(),
    { dismissible: true, closeOnBackdrop: true, size: 'md' },
);

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const titleId = useId();
const panel = ref<HTMLElement | null>(null);
let previouslyFocused: HTMLElement | null = null;

const FOCUSABLE =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const close = () => {
    if (!props.dismissible) return;
    emit('update:modelValue', false);
};

const onBackdrop = () => {
    if (props.closeOnBackdrop) close();
};

const focusables = (): HTMLElement[] =>
    Array.from(panel.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);

const onTab = (event: KeyboardEvent) => {
    const items = focusables();
    if (!items.length) {
        event.preventDefault();
        panel.value?.focus();
        return;
    }
    const first = items[0]!;
    const last = items[items.length - 1]!;
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
    }
};

watch(
    () => props.modelValue,
    async (open) => {
        if (open) {
            previouslyFocused = (document.activeElement as HTMLElement | null) ?? null;
            await nextTick();
            const first = focusables()[0];
            (first ?? panel.value)?.focus();
        } else {
            previouslyFocused?.focus();
            previouslyFocused = null;
        }
    },
    { immediate: true },
);
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: opacity 150ms ease;
}
.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}
</style>
