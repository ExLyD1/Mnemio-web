<template>
    <div
        class="flex flex-col gap-3 rounded-2xl border border-lavender/40 bg-lavender-soft p-5 sm:flex-row sm:items-center sm:justify-between"
    >
        <div class="flex items-center gap-3">
            <div class="grid size-10 place-items-center rounded-xl bg-brand text-cream">
                <Play class="size-5" />
            </div>
            <div>
                <p class="text-small text-cream-dim">{{ t('dashboard.continueLabel') }}</p>
                <p class="text-h3 font-semibold text-cream">
                    {{ deckTitle ?? t('dashboard.continueUnknownDeck') }}
                </p>
                <p class="text-small text-cream-faint">
                    {{
                        t('dashboard.continueProgress')
                            .replace('{i}', String(session.index))
                            .replace('{n}', String(session.cardIds.length))
                    }}
                </p>
            </div>
        </div>
        <UiButton variant="primary" @click="$emit('resume')">
            {{ t('dashboard.continueResume') }}
        </UiButton>
    </div>
</template>

<script setup lang="ts">
import { Play } from 'lucide-vue-next';
import type { StudySession } from '@/types/session';
import { useT } from '@/composables/useT';

defineProps<{ session: StudySession; deckTitle: string | null }>();
defineEmits<{ resume: [] }>();

const { t } = useT();
</script>
