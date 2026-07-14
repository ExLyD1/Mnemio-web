<template>
    <div ref="root" class="relative w-full">
        <!-- Trigger -->
        <button
            type="button"
            role="combobox"
            :aria-expanded="open"
            aria-haspopup="listbox"
            class="flex w-full items-center justify-between rounded-xl border border-line-strong bg-bg-well px-3.5 py-3 text-[14px] text-cream transition-colors hover:border-brand-muted focus:border-brand-muted focus:outline-none dark:bg-[rgba(255,255,255,.03)]"
            @click="toggle"
        >
            <span :class="modelValue ? 'text-cream' : 'text-cream-faint'">
                {{ selectedLabel }}
            </span>
            <ChevronDown
                class="size-4 shrink-0 text-brand-muted transition-transform duration-150"
                :class="open ? 'rotate-180' : ''"
            />
        </button>

        <!-- Panel (teleport so it escapes overflow containers) -->
        <Teleport to="body">
            <Transition name="cs-pop">
                <div
                    v-if="open"
                    :style="panelStyle"
                    class="fixed z-[300] rounded-2xl border border-line-strong bg-bg-surface shadow-soft-elevation"
                    role="listbox"
                    :aria-activedescendant="
                        focused >= 0 ? `cs-opt-${filtered[focused]?.value}` : undefined
                    "
                >
                    <!-- Search input -->
                    <div class="border-b border-line p-2">
                        <input
                            ref="searchEl"
                            v-model="query"
                            type="text"
                            :placeholder="t('deck.categorySearch')"
                            class="w-full rounded-lg bg-bg-muted px-3 py-2 text-[13px] text-cream outline-none placeholder:text-cream-faint"
                            @keydown="onKey"
                        />
                    </div>
                    <!-- Scrollable list -->
                    <div ref="listEl" class="max-h-52 overflow-y-auto p-1.5">
                        <button
                            v-for="(opt, i) in filtered"
                            :id="`cs-opt-${opt.value}`"
                            :key="opt.value"
                            type="button"
                            role="option"
                            :aria-selected="modelValue === opt.value"
                            class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] transition-colors"
                            :class="[
                                focused === i ? 'bg-brand/25 text-cream' : '',
                                modelValue === opt.value && focused !== i
                                    ? 'bg-brand/15 text-cream'
                                    : focused !== i
                                      ? 'text-brand-pale hover:bg-brand/15'
                                      : '',
                            ]"
                            @click="pick(opt.value)"
                            @mouseenter="focused = i"
                        >
                            <span>{{ opt.label }}</span>
                            <Check
                                v-if="modelValue === opt.value"
                                class="size-3.5 shrink-0 text-lavender"
                            />
                        </button>
                        <p v-if="!filtered.length" class="px-3 py-2 text-[13px] text-cream-faint">
                            {{ t('deck.categoryNoResults') }}
                        </p>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ChevronDown, Check } from 'lucide-vue-next';
import { onClickOutside } from '@vueuse/core';
import { useT } from '@/composables/useT';

interface Option {
    value: string;
    label: string;
}

const props = withDefaults(
    defineProps<{
        modelValue: string;
        options: Option[];
        placeholder?: string;
    }>(),
    { placeholder: '' },
);

const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const { t } = useT();

const root = ref<HTMLElement | null>(null);
const searchEl = ref<HTMLInputElement | null>(null);
const listEl = ref<HTMLElement | null>(null);
const open = ref(false);
const query = ref('');
const focused = ref(-1);
const panelStyle = ref<Record<string, string>>({});

const selectedLabel = computed(
    () => props.options.find((o) => o.value === props.modelValue)?.label ?? props.placeholder,
);

const filtered = computed(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) return props.options;
    return props.options.filter((o) => o.label.toLowerCase().includes(q));
});

const computePosition = () => {
    if (!root.value) return;
    const rect = root.value.getBoundingClientRect();
    const panelWidth = Math.max(rect.width, 220);
    panelStyle.value = {
        top: `${rect.bottom + 6}px`,
        left: `${rect.left}px`,
        width: `${panelWidth}px`,
    };
};

const toggle = () => {
    if (open.value) {
        open.value = false;
    } else {
        computePosition();
        open.value = true;
        query.value = '';
        // Pre-focus the current value
        const idx = filtered.value.findIndex((o) => o.value === props.modelValue);
        focused.value = idx >= 0 ? idx : 0;
        nextTick(() => {
            searchEl.value?.focus();
            scrollToFocused();
        });
    }
};

const close = () => {
    open.value = false;
};

const pick = (value: string) => {
    emit('update:modelValue', value);
    close();
};

const scrollToFocused = () => {
    if (!listEl.value || focused.value < 0) return;
    const item = listEl.value.children[focused.value] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
};

const onKey = (e: KeyboardEvent) => {
    if (!open.value) return;
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        focused.value = Math.min(focused.value + 1, filtered.value.length - 1);
        nextTick(scrollToFocused);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focused.value = Math.max(focused.value - 1, 0);
        nextTick(scrollToFocused);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (focused.value >= 0 && filtered.value[focused.value]) {
            pick(filtered.value[focused.value].value);
        }
    } else if (e.key === 'Escape') {
        close();
    }
};

// Reset focused index when filter changes
watch(query, () => {
    focused.value = 0;
});

onClickOutside(root, close);
</script>

<style scoped>
.cs-pop-enter-active,
.cs-pop-leave-active {
    transition:
        opacity 0.14s ease,
        transform 0.14s ease;
}
.cs-pop-enter-from,
.cs-pop-leave-to {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
}
</style>
