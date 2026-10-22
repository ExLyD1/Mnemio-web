<template>
    <div class="flex items-start justify-between gap-4 py-2 text-[15px]">
        <span class="text-cream-dim">{{ label }}</span
        ><span class="text-right font-bold text-cream">{{ value }}</span>
    </div>
</template>
<script setup lang="ts">
defineProps<{ label: string; value: string }>();
</script>
