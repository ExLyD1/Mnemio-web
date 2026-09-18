<template>
    <div
        class="w-full max-w-md rounded-3xl border border-line-strong bg-bg-surface p-8 shadow-soft-elevation"
    >
        <div class="mb-6 flex flex-col items-center gap-2 text-center">
            <SharedBrandMark />
            <p class="text-small text-brand-muted">{{ t('auth.welcomeSubtitle') }}</p>
        </div>
        <LoginAuthForm
            v-if="step === 'auth'"
            :initial-tab="initialTab"
            :loading="login.loading.value || register.loading.value"
            @submit="onAuthSubmit"
        />
        <LoginRegisterEmail
            v-else-if="step === 'verify'"
            :email="data.email"
            :loading="verifyEmail.loading.value"
            @submit="onOtpSubmit"
            @resend="onResend"
        />
        <LoginRegisterAcountDetails
            v-else-if="step === 'details'"
            :loading="updateProfile.loading.value"
            @submit="onDetailsSubmit"
        />

        <p class="mt-5 text-center text-small text-brand-muted">
            {{ t('auth.legalPrefix') }}
            <NuxtLink to="/terms" class="text-accent hover:underline">{{
                t('auth.termsLink')
            }}</NuxtLink
            >,
            <br />
            <NuxtLink to="/privacy" class="text-accent hover:underline">{{
                t('auth.privacyLink')
            }}</NuxtLink>
        </p>
    </div>
</template>

<script setup lang="ts">
import { useAuth, useAuthStore, useToast, useT } from '#imports';
import { setRemember } from '@/utils/authToken';
import { rememberReturnTo, takeReturnTo } from '@/utils/returnTo';
import { usernameErrorKey } from '@/utils/username';
import { useAnalytics } from '@/composables/useAnalytics';

definePageMeta({ layout: 'auth' });

const route = useRoute();
const authStore = useAuthStore();
const { login, register, verifyEmail, resendOtp, updateProfile } = useAuth();
const toast = useToast();
const { t } = useT();
const analytics = useAnalytics();

useSeo({ title: t('seo.loginTitle'), description: t('seo.loginDesc'), noindex: true });

type Tab = 'register' | 'login';

const step = ref<'auth' | 'verify' | 'details'>('auth');
const data = reactive<{ email: string; password: string }>({
    email: '',
    password: '',
});
const initialTab = route.query.tab === 'register' ? 'register' : ('login' as const);

// Remember where the user was headed (set by the auth middleware) so OAuth and
// the multi-step email flow can return them there after sign-in.
onMounted(() => rememberReturnTo(route.query.next));

// The boot-time hydrate() can restore a session from the refresh cookie after
// the route guard already sent the visitor here — don't leave a signed-in
// user sitting on the login form.
// Only for that boot-time restore — once the user submits the form, the
// submit handlers own the navigation (finishAuth), so this must not race them.
let userActed = false;
watch(
    () => authStore.isAuthenticated,
    (authed) => {
        if (authed && !userActed && step.value === 'auth' && !authStore.needsProfile) {
            navigateTo(takeReturnTo());
        }
    },
    { immediate: true },
);

const showError = (msg: string) => toast.error(t(msg, msg));

const finishAuth = async () => {
    if (authStore.needsProfile) {
        step.value = 'details';
    } else {
        await navigateTo(takeReturnTo());
    }
};

async function onAuthSubmit(payload: {
    email: string;
    password: string;
    activeTab: Tab;
    rememberMe: boolean;
}) {
    userActed = true;
    data.email = payload.email;
    data.password = payload.password;

    if (payload.activeTab === 'login') {
        setRemember(payload.rememberMe);
        const result = await login.execute(payload.email, payload.password);
        if (result) {
            await finishAuth();
            return;
        }
        const err = login.error.value;
        if (err?.code === 'EMAIL_NOT_VERIFIED') {
            const userId = ((err.details ?? {}) as { userId?: string }).userId ?? null;
            if (userId) {
                authStore.pendingUserId = userId;
                step.value = 'verify';
                toast.info(t('auth.verifyHint', 'Please verify your email.'));
                return;
            }
        }
        if (err) showError(err.message);
        return;
    }

    const result = await register.execute(payload.email, payload.password);
    if (result) {
        step.value = 'verify';
    } else if (register.error.value) {
        showError(register.error.value.message);
    }
}

async function onOtpSubmit(payload: { code: string }) {
    const result = await verifyEmail.execute(payload.code);
    if (result) {
        await finishAuth();
    } else if (verifyEmail.error.value) {
        analytics.track('email_verification_failed', {
            error_code: verifyEmail.error.value.code ?? 'unknown',
        });
        showError(verifyEmail.error.value.message);
    }
}

async function onResend() {
    const result = await resendOtp.execute();
    if (result) {
        toast.success(t('auth.otpResent', 'New code sent.'));
    } else if (resendOtp.error.value) {
        showError(resendOtp.error.value.message);
    }
}

async function onDetailsSubmit(payload: { fullName: string; username: string; birthday: string }) {
    const result = await updateProfile.execute(payload);
    if (result) {
        await navigateTo(takeReturnTo());
        return;
    }
    const err = updateProfile.error.value;
    if (!err) {
        return;
    }
    // The backend answers in English; show username problems in the UI language.
    if (err.code === 'AUTH_USERNAME_TAKEN') {
        showError(usernameErrorKey('taken'));
    } else if (err.code === 'VALIDATION_ERROR' && /username/i.test(err.message)) {
        showError(usernameErrorKey('invalid_chars'));
    } else {
        showError(err.message);
    }
}
</script>
