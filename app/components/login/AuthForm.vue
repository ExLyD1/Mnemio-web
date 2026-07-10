<template>
    <form class="max-w-[500px] w-full" novalidate @submit="onSubmit">
        <UiTabs v-model="activeTab" :tabs="tabs" class="mb-[32px]" />

        <div class="text-[#E3D2C8]">
            <!-- Social buttons -->
            <div class="mb-[28px] flex gap-3">
                <button
                    v-for="social in socials"
                    :key="social.label"
                    type="button"
                    :disabled="!social.enabled || (social.provider === 'google' && googleBusy)"
                    :aria-label="
                        social.enabled
                            ? social.label
                            : `${social.label} — ${t('auth.socialComingSoon')}`
                    "
                    :title="social.enabled ? undefined : t('auth.socialComingSoon')"
                    class="flex size-12 items-center justify-center rounded-full bg-neutral-0 shadow-sm transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40"
                    @click="onSocial(social)"
                >
                    <img :src="social.icon" :alt="social.label" class="size-5" />
                </button>
            </div>

            <div class="flex flex-col gap-[20px]">
                <p class="text-small text-brand-muted">
                    {{
                        t(
                            activeTab === 'login'
                                ? 'auth.orLoginWithEmail'
                                : 'auth.orRegisterWithEmail',
                        )
                    }}
                </p>

                <div>
                    <UiInputField
                        v-model="email"
                        :label="t('auth.emailLabel')"
                        type="email"
                        :placeholder="t('auth.emailPlaceholder')"
                    >
                        <template #suffix>
                            <Check
                                class="size-4 transition-opacity"
                                :class="isEmailValid ? 'opacity-100' : 'opacity-0'"
                            />
                        </template>
                    </UiInputField>
                    <p v-if="emailError" class="mt-1.5 text-small text-error" aria-live="polite">
                        {{ t(emailError) }}
                    </p>
                </div>

                <div>
                    <UiInputField
                        v-model="password"
                        :label="t('auth.passwordLabel')"
                        type="password"
                        placeholder="••••••••"
                    >
                        <template #suffix>
                            <Check
                                class="size-4 transition-opacity"
                                :class="isPasswordValid ? 'opacity-100' : 'opacity-0'"
                            />
                        </template>
                    </UiInputField>
                    <p class="mt-1.5 min-h-[20px] text-small" aria-live="polite">
                        <span v-if="passwordError" class="text-error">{{ t(passwordError) }}</span>
                        <span v-else-if="activeTab === 'register'">{{
                            t('auth.passwordHint')
                        }}</span>
                    </p>
                </div>
            </div>

            <UiButton
                type="submit"
                variant="primary"
                class="mt-[32px] w-full rounded-xl text-body font-bold"
                :disabled="loading"
            >
                <UiSpinner v-if="loading" size="sm" class="mr-2" />
                {{ t(activeTab === 'login' ? 'auth.tabLogin' : 'auth.createAccount') }}
            </UiButton>

            <label
                v-if="activeTab === 'login'"
                class="mt-4 flex cursor-pointer items-center gap-2 text-small text-brand-muted"
            >
                <input v-model="rememberMe" type="checkbox" class="accent-brand" />
                {{ t('auth.stayLoggedIn') }}
            </label>
        </div>
    </form>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { useForm, useField } from 'vee-validate';
import { loginSchema, registerSchema } from '@/schemas/auth';
import { toFormValidator } from '@/utils/zodValidator';
import { useT } from '@/composables/useT';
import { useAnalytics } from '@/composables/useAnalytics';

const { t } = useT();
const route = useRoute();
const analytics = useAnalytics();

// Where the registration intent came from (e.g. a discover deck copy redirect).
const entryPoint = () => String(route.query.from ?? route.query.intent ?? 'login_page');

const props = withDefaults(
    defineProps<{ initialTab?: 'register' | 'login'; loading?: boolean }>(),
    { loading: false },
);

const emit = defineEmits<{
    submit: [
        { email: string; password: string; activeTab: 'register' | 'login'; rememberMe: boolean },
    ];
}>();

const activeTab = ref<'register' | 'login'>(props.initialTab ?? 'register');
const rememberMe = ref(true);

const schema = computed(() =>
    toFormValidator(activeTab.value === 'login' ? loginSchema : registerSchema),
);

const { handleSubmit, resetForm } = useForm<{ email: string; password: string }>({
    validationSchema: schema,
    initialValues: { email: '', password: '' },
});

const { value: email, errorMessage: emailError } = useField<string>('email');
const { value: password, errorMessage: passwordError } = useField<string>('password');

const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value ?? ''));
const isPasswordValid = computed(() => (password.value?.length ?? 0) >= 8);

watch(activeTab, () => resetForm());

const onSubmit = handleSubmit((values) => {
    if (activeTab.value === 'register') {
        analytics.track('signup_started', { method: 'email', entry_point: entryPoint() });
    }
    emit('submit', {
        email: values.email,
        password: values.password,
        activeTab: activeTab.value,
        rememberMe: rememberMe.value,
    });
});

const tabs = computed(() => [
    { key: 'register', label: t('auth.tabRegister') },
    { key: 'login', label: t('auth.tabLogin') },
]);

// Only Google ships at MVP (see docs/api-contract.md). Apple/Facebook stay
// visible but disabled until their backends exist.
interface Social {
    label: string;
    icon: string;
    provider: 'apple' | 'facebook' | 'google';
    enabled: boolean;
}

const socials: Social[] = [
    { label: 'Apple', icon: '/images/shared/social/apple.svg', provider: 'apple', enabled: false },
    {
        label: 'Facebook',
        icon: '/images/shared/social/facebook.svg',
        provider: 'facebook',
        enabled: false,
    },
    {
        label: 'Google',
        icon: '/images/shared/social/google.svg',
        provider: 'google',
        enabled: true,
    },
];

const config = useRuntimeConfig();
const googleBusy = ref(false);

// OAuth initiation must hit the backend ORIGIN directly — NOT the same-origin /api
// proxy, which follows the backend's 302 to Google and serves Google's HTML under our
// origin (breaks CSP/CORS, so the Google form's JS never runs). When NUXT_PUBLIC_OAUTH_BASE
// is set we navigate cross-origin straight to the backend, so its 302 → Google is a real
// browser redirect. Falls back to apiBase / same-origin only for local/unconfigured setups.
const oauthBase = computed(() => String(config.public.oauthBase || config.public.apiBase || ''));

const onSocial = async (social: Social) => {
    if (!social.enabled || social.provider !== 'google' || googleBusy.value) {
        return;
    }
    if (activeTab.value === 'register') {
        analytics.track('signup_started', { method: 'google', entry_point: entryPoint() });
    }
    const base = oauthBase.value;
    const url = `${base}/api/v1/auth/oauth/google`;

    // Cross-origin (configured backend) → go straight there; a CORS pre-flight probe
    // would be blocked and is pointless.
    if (base) {
        window.location.assign(url);
        return;
    }

    // Same-origin fallback (local dev): probe so an unconfigured server shows the
    // friendly /auth/oauth/error page instead of dumping raw JSON.
    googleBusy.value = true;
    try {
        const res = await fetch(url, { method: 'GET', credentials: 'include', redirect: 'manual' });
        if (res.type === 'opaqueredirect' || res.status === 0 || res.ok) {
            window.location.assign(url);
            return;
        }
        let code = 'exchange_failed';
        try {
            const j = (await res.json()) as { code?: string };
            if (j.code) {
                code = j.code;
            }
        } catch {
            // non-JSON body; keep the default reason
        }
        await navigateTo(`/auth/oauth/error?reason=${encodeURIComponent(code)}`);
    } catch {
        window.location.assign(url);
    } finally {
        googleBusy.value = false;
    }
};
</script>
