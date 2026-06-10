<template>
    <div
        class="w-full max-w-md rounded-3xl border border-line-strong bg-bg-surface p-8 text-center shadow-soft-elevation"
    >
        <SharedBrandMark class="mx-auto" />
        <h1 class="mt-5 font-display text-h2 text-cream">{{ t('oauth.err.title') }}</h1>
        <p class="mt-2 text-body text-brand-muted">{{ message }}</p>
        <UiButton variant="light" class="mt-6 w-full" @click="navigateTo('/login')">
            {{ t('oauth.backToSignIn') }}
        </UiButton>
    </div>
</template>

<script setup lang="ts">
import { useT } from '#imports';

definePageMeta({ layout: 'auth' });

const route = useRoute();
const { t } = useT();

useSeo({ title: t('seo.loginTitle'), description: t('seo.appDesc'), noindex: true });

const KNOWN = new Set([
    'OAUTH_NOT_CONFIGURED',
    'OAUTH_EMAIL_UNVERIFIED',
    'AUTH_EMAIL_UNVERIFIED_LINK',
    'OAUTH_EXCHANGE_EXPIRED',
    'OAUTH_BAD_EXCHANGE_CODE',
    'exchange_failed',
    'missing_code',
]);

const message = computed(() => {
    const reason = typeof route.query.reason === 'string' ? route.query.reason : '';
    return KNOWN.has(reason) ? t(`oauth.err.${reason}`) : t('oauth.err.generic');
});
</script>
