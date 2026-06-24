<template>
    <span
        class="inline-grid place-items-center overflow-hidden rounded-full font-semibold text-on-color shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
        :style="style"
    >
        <img v-if="src" :src="src" :alt="name" class="size-full object-cover" />
        <span v-else>{{ initials }}</span>
    </span>
</template>

<script setup lang="ts">
const props = withDefaults(
    defineProps<{ name?: string; hue?: number; src?: string; size?: number }>(),
    { name: '', hue: 286, size: 36 },
);

const initials = computed(() => {
    const parts = props.name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
        return '?';
    }
    if (parts.length === 1) {
        return parts[0]!.charAt(0).toUpperCase();
    }
    return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
});

const style = computed(() => ({
    width: `${props.size}px`,
    height: `${props.size}px`,
    fontSize: `${Math.round(props.size * 0.4)}px`,
    background: props.src
        ? undefined
        : `radial-gradient(130% 130% at 30% 20%, hsl(${props.hue} 42% 42%), hsl(${props.hue} 45% 16%))`,
}));
</script>
