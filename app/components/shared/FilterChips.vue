<template>
    <div
        role="group"
        :aria-label="label"
        :class="[
            'flex items-center gap-2',
            // Scroll: one row that scrolls sideways on narrow screens.
            scroll ? '-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none]' : 'flex-wrap',
        ]"
    >
        <button
            v-for="opt in options"
            :key="opt.key"
            type="button"
            :class="[
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-small font-semibold transition-colors',
                modelValue === opt.key
                    ? 'border-pink-soft/30 bg-brand text-on-color'
                    : 'border-line-strong text-cream-faint hover:text-cream',
            ]"
            :aria-pressed="modelValue === opt.key"
            @click="$emit('update:modelValue', opt.key)"
        >
            {{ opt.label }}
            <span
                v-if="opt.count !== undefined"
                :class="modelValue === opt.key ? 'text-cream/70' : 'text-cream-faint/70'"
            >
                {{ opt.count }}
            </span>
        </button>
    </div>
</template>

<script setup lang="ts">
withDefaults(
    defineProps<{
        modelValue: string;
        options: { key: string; label: string; count?: number }[];
        /** Accessible name for the group. */
        label?: string;
        /** Single scrolling row instead of wrapping. */
        scroll?: boolean;
    }>(),
    { label: undefined, scroll: false },
);

defineEmits<{ 'update:modelValue': [value: string] }>();
</script>
