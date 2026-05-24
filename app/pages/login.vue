<template>
    <div class="w-full max-w-md rounded-3xl bg-brand-dark p-8">
        <LoginAuthForm
            v-if="step === 'auth'"
            :initial-tab="initialTab"
            :loading="login.loading.value || register.loading.value"
            @submit="onAuthSubmit"
        />
        <LoginRegisterEmail
            v-else-if="step === 'verify'"
            :email="data.email"
            @submit="onOtpSubmit"
        />
        <LoginRegisterAcountDetails
            v-else-if="step === 'details'"
            :loading="updateProfile.loading.value"
            @submit="onDetailsSubmit"
        />

        <p class="mt-5 text-center text-small text-brand-muted">
            By continuing I agree with the
            <NuxtLink to="/terms" class="text-accent hover:underline"
                >Terms &amp; Conditions</NuxtLink
            >,
            <br />
            <NuxtLink to="/privacy-policy" class="text-accent hover:underline"
                >Privacy Policy</NuxtLink
            >
        </p>
    </div>
</template>

<script setup lang="ts">
import { useAuth, useAuthStore, useToast, useT } from '#imports';

definePageMeta({ layout: 'auth' });

const route = useRoute();
const authStore = useAuthStore();
const { login, register, updateProfile } = useAuth();
const toast = useToast();
const { t } = useT();

type Tab = 'register' | 'login';

const step = ref<'auth' | 'verify' | 'details'>('auth');
const data = reactive<{ email: string; password: string }>({
    email: '',
    password: '',
});
const initialTab = route.query.tab === 'login' ? 'login' : ('register' as const);

const finishAuth = async () => {
    if (authStore.needsProfile) {
        step.value = 'details';
    } else {
        await navigateTo('/dashboard');
    }
};

async function onAuthSubmit(payload: { email: string; password: string; activeTab: Tab }) {
    data.email = payload.email;
    data.password = payload.password;

    if (payload.activeTab === 'login') {
        const result = await login.execute(payload.email, payload.password);
        if (result) {
            await finishAuth();
        } else if (login.error.value) {
            toast.error(t(login.error.value.message, login.error.value.message));
        }
        return;
    }

    step.value = 'verify';
}

async function onOtpSubmit(_payload: { code: string }) {
    const result = await register.execute(data.email, data.password);
    if (result) {
        step.value = 'details';
    } else if (register.error.value) {
        toast.error(t(register.error.value.message, register.error.value.message));
        step.value = 'auth';
    }
}

async function onDetailsSubmit(payload: { fullName: string; username: string; birthday: string }) {
    const result = await updateProfile.execute(payload);
    if (result) {
        await navigateTo('/dashboard');
    } else if (updateProfile.error.value) {
        toast.error(t(updateProfile.error.value.message, updateProfile.error.value.message));
    }
}
</script>
