<template>
    <div class="w-full max-w-md rounded-3xl bg-brand-dark p-8">
        <LoginAuthForm v-if="step === 'auth'" :initial-tab="initialTab" @submit="onAuthSubmit" />
        <LoginRegisterEmail
            v-else-if="step === 'verify'"
            @submit="onRegisterSubmit"
            :email="data.email"
        />
        <LoginRegisterAcountDetails v-else-if="step === 'details'" />

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
definePageMeta({ layout: 'auth' });

import { useAuth } from '#imports';

const route = useRoute();

const { login, register } = useAuth();

type Tab = 'register' | 'login' | 'registerAcountDetails';

const step = ref<'auth' | 'verify' | 'details'>('auth');
const data = reactive<{
    email: string;
    password: string;
    activeTab: Tab;
}>({
    email: '',
    password: '',
    activeTab: 'register',
});
const initialTab = route.query.tab === 'login' ? 'login' : ('register' as const);

function onAuthSubmit(payload: { email: string; password: string; activeTab: Tab }) {
    data.email = payload.email;
    data.password = payload.password;
    data.activeTab = payload.activeTab;
    if (payload.activeTab === 'register') step.value = 'verify';
}

async function onRegisterSubmit(_payload: { email: string; password: string; code: string }) {
    const result = await register.execute(data.email, data.password);
    if (result) step.value = 'details';
}
</script>
