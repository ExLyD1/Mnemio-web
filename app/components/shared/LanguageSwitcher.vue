<template>
    <div
        v-if="variant === 'menu'"
        class="flex items-center gap-2 rounded-xl px-3 py-2 text-body text-brand-pale"
    >
        <Languages class="size-4 text-brand-muted" />
        <span>{{ t('common.language') }}</span>
        <div class="ml-auto flex items-center gap-1">
            <button
                v-for="opt in options"
                :key="opt.code"
                type="button"
                class="rounded-md px-2 py-0.5 text-small font-semibold transition-colors"
                :class="
                    current === opt.code
                        ? 'bg-brand text-on-color'
                        : 'text-brand-muted hover:text-cream'
                "
                @click="set(opt.code)"
            >
                {{ opt.short }}
            </button>
        </div>
    </div>

    <div v-else class="flex gap-2">
        <button
            v-for="opt in options"
            :key="opt.code"
            type="button"
            class="flex-1 rounded-xl border px-4 py-2.5 text-body transition-colors"
            :class="
                current === opt.code
                    ? 'border-brand-bright bg-brand/20 text-cream'
                    : 'border-line text-brand-muted hover:text-cream'
            "
            @click="set(opt.code)"
        >
            {{ opt.label }}
        </button>
    </div>
</template>

<script setup lang="ts">
import { Languages } from 'lucide-vue-next';
import { useAppLocale } from '@/composables/useAppLocale';
import { useT } from '@/composables/useT';

withDefaults(defineProps<{ variant?: 'menu' | 'segmented' }>(), { variant: 'menu' });

const { current, set, options } = useAppLocale();
const { t } = useT();
</script>
