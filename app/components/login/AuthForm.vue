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
                    :aria-label="social.label"
                    class="flex size-12 items-center justify-center rounded-full bg-neutral-0 shadow-sm transition-opacity hover:opacity-80"
                >
                    <img :src="social.icon" :alt="social.label" class="size-5" />
                </button>
            </div>

            <div class="flex flex-col gap-[20px]">
                <p class="text-small">
                    {{ t(activeTab === 'login' ? 'auth.orLoginWithEmail' : 'auth.orRegisterWithEmail') }}
                </p>

                <div>
                    <UiInputField
                        v-model="email"
                        label="Email address"
                        type="email"
                        placeholder="example@mail.com"
                    >
                        <template #suffix>
                            <Check v-if="isEmailValid" class="size-4" />
                        </template>
                    </UiInputField>
                    <p
                        v-if="emailError"
                        class="mt-1.5 text-small text-error"
                        aria-live="polite"
                    >
                        {{ t(emailError) }}
                    </p>
                </div>

                <div>
                    <UiInputField
                        v-model="password"
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                    >
                        <template #suffix>
                            <Check v-if="isPasswordValid" class="size-4" />
                        </template>
                    </UiInputField>
                    <p class="mt-1.5 min-h-[20px] text-small" aria-live="polite">
                        <span v-if="passwordError" class="text-error">{{ t(passwordError) }}</span>
                        <span v-else-if="activeTab === 'register'">{{ t('auth.passwordHint') }}</span>
                    </p>
                </div>
            </div>

            <UiButton
                type="submit"
                variant="light"
                class="mt-[32px] w-full rounded-xl text-body font-bold"
                :disabled="loading"
            >
                <UiSpinner v-if="loading" size="sm" class="mr-2" />
                {{ t(activeTab === 'login' ? 'auth.tabLogin' : 'auth.createAccount') }}
            </UiButton>
        </div>
    </form>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { useForm, useField } from 'vee-validate';
import { loginSchema, registerSchema } from '@/schemas/auth';
import { toFormValidator } from '@/utils/zodValidator';
import { useT } from '@/composables/useT';

const { t } = useT();

const props = withDefaults(
    defineProps<{ initialTab?: 'register' | 'login'; loading?: boolean }>(),
    { loading: false },
);

const emit = defineEmits<{
    submit: [{ email: string; password: string; activeTab: 'register' | 'login' }];
}>();

const activeTab = ref<'register' | 'login'>(props.initialTab ?? 'register');

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
    emit('submit', { email: values.email, password: values.password, activeTab: activeTab.value });
});

const tabs = computed(() => [
    { key: 'register', label: t('auth.tabRegister') },
    { key: 'login', label: t('auth.tabLogin') },
]);

const socials = [
    { label: 'Apple', icon: '/images/shared/social/apple.svg' },
    { label: 'Facebook', icon: '/images/shared/social/facebook.svg' },
    { label: 'Google', icon: '/images/shared/social/google.svg' },
];
</script>
