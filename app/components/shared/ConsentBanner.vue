<template>
    <Transition name="fade">
        <div
            v-if="show"
            class="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-bg-base/95 px-4 py-3 backdrop-blur md:inset-x-auto md:bottom-4 md:left-4 md:max-w-sm md:rounded-2xl md:border"
            role="dialog"
            aria-live="polite"
            :aria-label="t('consent.title')"
        >
            <p class="text-small text-cream">{{ t('consent.message') }}</p>
            <div class="mt-3 flex items-center gap-2">
                <UiButton variant="primary" class="!px-4 !py-2 text-small" @click="accept">
                    {{ t('consent.accept') }}
                </UiButton>
                <UiButton variant="ghost" class="!px-3.5 !py-2 text-small" @click="decline">
                    {{ t('consent.decline') }}
                </UiButton>
                <NuxtLink
                    to="/privacy"
                    class="ml-auto text-small text-brand-muted underline-offset-2 hover:underline"
                >
                    {{ t('consent.learnMore') }}
                </NuxtLink>
            </div>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import { useConsentStore } from '@/stores/consent';
import { useT } from '@/composables/useT';

const consent = useConsentStore();
const { t } = useT();

// Only after mount: the undecided state is client-truth (cookie) and we don't
// want a server/client flash before hydration settles it.
const mounted = ref(false);
onMounted(() => (mounted.value = true));

const show = computed(() => mounted.value && !consent.isDecided);

const accept = () => consent.accept();
const decline = () => consent.decline();
</script>
