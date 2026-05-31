<template>
    <section class="px-8 py-15">
        <div class="mx-auto max-w-[1240px]">
            <div
                class="grid border-y border-line md:grid-cols-2 lg:grid-cols-4"
            >
                <div
                    v-for="(stat, i) in stats"
                    :key="stat.label"
                    :class="[
                        'flex flex-col items-center gap-2 py-10',
                        i < stats.length - 1 ? 'lg:border-r lg:border-line' : '',
                        i < stats.length - 1 ? 'border-b border-line md:border-b-0' : '',
                    ]"
                >
                    <div
                        class="font-display text-[clamp(36px,4vw,56px)] font-light text-cream"
                    >
                        {{ stat.value }}
                    </div>
                    <div class="text-small text-cream-faint">{{ stat.label }}</div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
const stats = [
    { value: '14,000+', label: 'daily learners' },
    { value: '2.3M', label: 'cards reviewed' },
    { value: '92%', label: '30-day recall' },
    { value: '38', label: 'languages supported' },
];
</script>
