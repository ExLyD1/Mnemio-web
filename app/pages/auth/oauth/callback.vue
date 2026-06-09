<template>
    <div
        class="w-full max-w-md rounded-3xl border border-line-strong bg-bg-surface p-8 text-center shadow-soft-elevation"
    >
        <div class="flex flex-col items-center gap-4">
            <SharedBrandMark />
            <UiSpinner size="lg" class="text-brand-bright" />
            <p class="text-body text-brand-muted">{{ t('oauth.signingIn') }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAuth, useT } from '#imports';

definePageMeta({ layout: 'auth' });

const route = useRoute();
const { oauthExchange, store } = useAuth();
const { t } = useT();

onMounted(async () => {
    const code = typeof route.query.code === 'string' ? route.query.code : '';
    if (!code) {
        await navigateTo('/auth/oauth/error?reason=missing_code');
        return;
    }
    const result = await oauthExchange.execute(code);
    if (result) {
        await navigateTo(store.needsProfile ? '/onboarding' : '/dashboard');
        return;
    }
    const reason = oauthExchange.error.value?.code ?? 'exchange_failed';
    await navigateTo(`/auth/oauth/error?reason=${encodeURIComponent(reason)}`);
});
</script>
