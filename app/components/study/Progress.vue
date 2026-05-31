<template>
    <header class="flex items-center justify-between gap-4">
        <button
            type="button"
            class="rounded-full border border-line-strong px-3 py-1.5 text-small text-cream-dim transition-colors hover:bg-white/[0.03]"
            @click="$emit('exit')"
        >
            <span class="flex items-center gap-1.5">
                <X class="size-3.5" />
                {{ t('study.exit') }}
            </span>
        </button>

        <div class="flex-1">
            <div class="flex items-end justify-between text-small text-cream-faint">
                <span>
                    {{ t('study.cardOfN').replace('{i}', String(index + 1)).replace('{n}', String(total)) }}
                </span>
                <span class="font-mono">{{ elapsed }}</span>
            </div>
            <div class="mt-1.5 grid gap-1" :style="{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }">
                <span
                    v-for="i in total"
                    :key="i"
                    :class="[
                        'h-1.5 rounded-full transition-colors',
                        i - 1 < index ? 'bg-lavender' : i - 1 === index ? 'bg-pink-soft' : 'bg-line-strong',
                    ]"
                />
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';
import { useT } from '@/composables/useT';

const props = defineProps<{
    index: number;
    total: number;
    elapsedMs: number;
}>();
defineEmits<{ exit: [] }>();

const { t } = useT();

const elapsed = computed(() => {
    const totalSec = Math.floor(props.elapsedMs / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
});
</script>
