<template>
    <Teleport to="body">
        <Transition name="modal">
            <div
                v-if="modelValue"
                :class="[
                    'fixed inset-0 z-[250] flex bg-scrim backdrop-blur-[2px]',
                    sheet
                        ? 'items-end justify-center p-0 md:items-center md:p-4'
                        : 'items-center justify-center p-4',
                ]"
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
                        sheet ? 'flex flex-col md:p-8' : '',
                        sheet === 'full'
                            ? 'h-dvh overflow-y-auto rounded-none md:h-auto md:max-h-[90dvh] md:rounded-[24px]'
                            : sheet
                              ? 'max-h-[94dvh] overflow-y-auto rounded-b-none rounded-t-[26px] md:rounded-[24px]'
                              : 'max-h-[90dvh] overflow-y-auto',
                    ]"
                >
                    <header
                        v-if="title || $slots.header"
                        :class="[
                            'mb-4 flex items-start justify-between gap-4',
                            sheet === 'full' ? 'sticky top-0 z-10 bg-bg-surface' : '',
                        ]"
                    >
                        <div class="min-w-0 flex-1">
                            <slot name="overline" />
                            <h2 v-if="title" :id="titleId" :class="headingClass">
                                <slot name="title">{{ title }}</slot>
                            </h2>
                            <slot name="header" />
                        </div>
                        <button
                            v-if="dismissible"
                            type="button"
                            class="grid size-11 shrink-0 place-items-center rounded-md text-brand-muted transition-colors hover:text-brand-pale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                            :disabled="busy"
                            :aria-label="t('common.close')"
                            @click="close"
                        >
                            <X class="size-5" />
                        </button>
                    </header>
                    <div :class="['text-body', sheet === 'full' ? 'flex-1' : '']">
                        <slot />
                    </div>
                    <footer
                        v-if="$slots.footer"
                        :class="[
                            'mt-6',
                            sheet
                                ? 'sticky bottom-0 bg-bg-surface pt-4 pb-[env(safe-area-inset-bottom)] md:static'
                                : '',
                        ]"
                    >
                        <slot name="error" />
                        <div
                            :class="[
                                'flex gap-2',
                                sheet
                                    ? 'flex-col-reverse md:flex-row md:flex-wrap md:justify-end'
                                    : 'flex-wrap justify-end',
                            ]"
                        >
                            <slot name="footer" />
                        </div>
                    </footer>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { useT } from '@/composables/useT';

const { t } = useT();

const props = withDefaults(
    defineProps<{
        modelValue: boolean;
        title?: string;
        dismissible?: boolean;
        closeOnBackdrop?: boolean;
        size?: 'sm' | 'md' | 'lg';
        sheet?: boolean | 'full';
        busy?: boolean;
        headingClass?: string;
    }>(),
    {
        dismissible: true,
        closeOnBackdrop: true,
        size: 'md',
        sheet: false,
        busy: false,
        headingClass: 'text-h3 font-bold text-cream',
    },
);

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

// Max-width per size; the panel is always `w-full` and capped by these.
const sizes: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
};

const titleId = useId();
const panel = ref<HTMLElement | null>(null);
let previouslyFocused: HTMLElement | null = null;

const FOCUSABLE =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

const close = () => {
    if (!props.dismissible || props.busy) return;
    emit('update:modelValue', false);
};

const onBackdrop = () => {
    if (props.closeOnBackdrop) close();
};

const focusables = (): HTMLElement[] =>
    Array.from(panel.value?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (element) => !element.hasAttribute('disabled') && element.getClientRects().length > 0,
    );

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
    if (
        event.shiftKey &&
        (active === first || active === panel.value || !panel.value?.contains(active))
    ) {
        event.preventDefault();
        last.focus();
    } else if (
        !event.shiftKey &&
        (active === last || active === panel.value || !panel.value?.contains(active))
    ) {
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
onBeforeUnmount(() => previouslyFocused?.focus());
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition:
        opacity 180ms ease-out,
        transform 180ms ease-out;
}
.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}
.modal-enter-active > div,
.modal-leave-active > div {
    transition: transform 180ms ease-out;
}
.modal-enter-from > div,
.modal-leave-to > div {
    transform: translateY(8px);
}
</style>
