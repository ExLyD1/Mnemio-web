<template>
    <div
        class="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-20 text-center"
    >
        <template v-if="state === 'polling'">
            <UiSpinner size="lg" />
            <div>
                <h1 class="font-display text-h2 text-cream">{{ t('billing.success.polling') }}</h1>
                <p class="mt-2 text-body text-cream-dim">{{ t('billing.success.pollingHint') }}</p>
            </div>
        </template>

        <template v-else-if="state === 'timeout'">
            <div>
                <h1 class="font-display text-h2 text-cream">
                    {{ t('billing.success.timeoutTitle') }}
                </h1>
                <p class="mt-2 max-w-[42ch] text-body text-cream-dim">
                    {{ t('billing.success.timeoutBody') }}
                </p>
            </div>
            <UiButton variant="primary" :disabled="polling" @click="retry">
                <UiSpinner v-if="polling" size="sm" />
                {{ t('billing.success.refreshButton') }}
            </UiButton>
        </template>
    </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { useBillingStore } from '@/stores/billing';
import { getSubscription } from '@/api/billing';
import { useT } from '@/composables/useT';
import { useToast } from '@/composables/useToast';

definePageMeta({ layout: false });

const { t } = useT();
const toast = useToast();
const auth = useAuthStore();
const billingStore = useBillingStore();

useSeo({ title: t('billing.success.seoTitle'), noindex: true });

const MAX_ATTEMPTS = 10;
const INTERVAL_MS = 3000;
const ACTIVE_STATUSES = new Set(['active', 'trialing']);

const state = ref<'polling' | 'timeout'>('polling');
const polling = ref(false);
let attempts = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

const poll = async () => {
    polling.value = true;
    attempts++;
    try {
        const sub = await getSubscription();
        if (ACTIVE_STATUSES.has(sub.status)) {
            await auth.hydrate();
            billingStore.resetCache();
            toast.success(t('billing.success.activated'));
            await navigateTo('/dashboard');
            return;
        }
    } catch (e) {
        const code = (e as { code?: string }).code;
        if (code !== 'BILLING_NO_SUBSCRIPTION') {
            state.value = 'timeout';
            polling.value = false;
            return;
        }
    } finally {
        polling.value = false;
    }

    if (attempts >= MAX_ATTEMPTS) {
        state.value = 'timeout';
        return;
    }

    timer = setTimeout(poll, INTERVAL_MS);
};

const retry = () => {
    attempts = 0;
    state.value = 'polling';
    poll();
};

onMounted(() => poll());
onUnmounted(() => {
    if (timer) clearTimeout(timer);
});
</script>
