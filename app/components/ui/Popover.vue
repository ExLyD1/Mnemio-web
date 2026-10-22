<template>
    <div ref="root" class="relative inline-block">
        <slot name="trigger" :open="isOpen" :toggle="toggle" :close="close" />
        <Teleport to="body">
            <Transition name="pop">
                <div
                    v-if="isOpen"
                    :style="panelStyle"
                    :class="side === 'top' ? 'pop-up' : ''"
                    class="fixed z-[200] min-w-[12rem] overflow-y-auto rounded-2xl border border-line-strong bg-bg-surface p-1.5 shadow-soft-elevation"
                    role="menu"
                >
                    <slot :close="close" />
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';

const props = withDefaults(
    defineProps<{ open?: boolean; align?: 'left' | 'right'; side?: 'bottom' | 'top' }>(),
    {
        open: undefined,
        align: 'left',
        side: 'bottom',
    },
);

const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const internal = ref(false);
const isOpen = computed(() => (props.open !== undefined ? props.open : internal.value));

const root = ref<HTMLElement | null>(null);
const panelStyle = ref<Record<string, string>>({});

const computePosition = () => {
    if (!root.value) return;
    const rect = root.value.getBoundingClientRect();
    // Opening upward anchors the panel's bottom edge above the trigger, so a trigger
    // near the bottom of the screen (e.g. the chat composer) never pushes it off-screen.
    const vertical: Record<string, string> =
        props.side === 'top'
            ? {
                  bottom: `${window.innerHeight - rect.top + 8}px`,
                  maxHeight: `${rect.top - 16}px`,
              }
            : {
                  top: `${rect.bottom + 8}px`,
                  maxHeight: `${window.innerHeight - rect.bottom - 16}px`,
              };
    panelStyle.value =
        props.align === 'right'
            ? { ...vertical, right: `${window.innerWidth - rect.right}px` }
            : { ...vertical, left: `${rect.left}px` };
};

const setOpen = (value: boolean) => {
    if (value) computePosition();
    if (props.open !== undefined) {
        emit('update:open', value);
    } else {
        internal.value = value;
    }
};

const toggle = () => setOpen(!isOpen.value);
const close = () => setOpen(false);

onClickOutside(root, () => close());

const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        close();
    }
};

onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
</script>

<style scoped>
.pop-enter-active,
.pop-leave-active {
    transition:
        opacity 0.16s ease,
        transform 0.16s ease;
}
.pop-enter-from,
.pop-leave-to {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
}
.pop-up.pop-enter-from,
.pop-up.pop-leave-to {
    transform: translateY(4px) scale(0.98);
}
</style>
