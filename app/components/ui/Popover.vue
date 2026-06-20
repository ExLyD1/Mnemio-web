<template>
    <div ref="root" class="relative inline-block">
        <slot name="trigger" :open="isOpen" :toggle="toggle" :close="close" />
        <Transition name="pop">
            <div
                v-if="isOpen"
                :class="[
                    'absolute z-[55] mt-2 min-w-[12rem] rounded-2xl border border-line-strong bg-bg-surface p-1.5 shadow-soft-elevation',
                    align === 'right' ? 'right-0' : 'left-0',
                ]"
                role="menu"
            >
                <slot :close="close" />
            </div>
        </Transition>
    </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';

const props = withDefaults(defineProps<{ open?: boolean; align?: 'left' | 'right' }>(), {
    open: undefined,
    align: 'left',
});

const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const internal = ref(false);
const isOpen = computed(() => (props.open !== undefined ? props.open : internal.value));

const setOpen = (value: boolean) => {
    if (props.open !== undefined) {
        emit('update:open', value);
    } else {
        internal.value = value;
    }
};

const toggle = () => setOpen(!isOpen.value);
const close = () => setOpen(false);

const root = ref<HTMLElement | null>(null);
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
</style>
