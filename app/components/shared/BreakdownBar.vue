<template>
    <div>
        <div class="flex h-3 w-full overflow-hidden rounded-full bg-line">
            <div
                v-for="seg in visibleSegments"
                :key="seg.label"
                :class="['h-full transition-all', seg.color]"
                :style="{ width: `${seg.pct}%` }"
            />
        </div>
        <div class="mt-3 flex flex-wrap gap-4">
            <div
                v-for="seg in segments"
                :key="seg.label"
                class="flex items-center gap-1.5 text-small text-brand-muted"
            >
                <span :class="['size-2.5 rounded-full', seg.color]" />
                {{ seg.label }}
                <span class="text-cream">{{ seg.count }}</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Segment {
    label: string;
    count: number;
    color: string;
}

const props = defineProps<{ segments: Segment[] }>();

const total = computed(() => props.segments.reduce((sum, s) => sum + s.count, 0) || 1);
const visibleSegments = computed(() =>
    props.segments
        .filter((s) => s.count > 0)
        .map((s) => ({ ...s, pct: (s.count / total.value) * 100 })),
);
</script>
