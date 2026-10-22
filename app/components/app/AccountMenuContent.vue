<template>
    <div class="w-full text-cream md:w-[304px] [&_button]:min-h-11">
        <div class="border-b border-line px-3 py-4">
            <p class="font-bold">{{ auth.user?.displayName || auth.user?.username }}</p>
            <p class="mt-1 break-all text-small text-cream-faint">{{ auth.user?.email }}</p>
        </div>
        <BillingPlanBlock menu class="my-2" @navigate="$emit('navigate')" />
        <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold hover:bg-bg-surface-2"
            @click="$emit('navigate')"
            ><component :is="link.icon" class="size-4" />{{ link.label }}</NuxtLink
        >
        <SharedLanguageSwitcher variant="menu" />
        <button
            type="button"
            class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-error-soft hover:bg-bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="logout.loading.value"
            @click="signOut"
        >
            <LogOut class="size-4" />{{ t('nav.signOut') }}
        </button>
    </div>
</template>
<script setup lang="ts">
import { User, Settings, Gem, LogOut } from 'lucide-vue-next';
const emit = defineEmits<{ navigate: [] }>();
const { t } = useT();
const auth = useAuthStore();
const { logout } = useAuth();
const toast = useToast();
const billing = useBillingStore();
const links = computed(() => [
    { to: '/profile', label: t('topbar.profile'), icon: User },
    ...(!billing.notConfigured
        ? [{ to: '/settings/billing', label: t('billing.subscription.nav'), icon: Gem }]
        : []),
    { to: '/profile?tab=edit', label: t('billing.subscription.settings'), icon: Settings },
]);
const signOut = async () => {
    await logout.execute();
    if (!logout.error.value) {
        billing.resetCache();
        emit('navigate');
        toast.success(t('auth.signedOut'));
        await navigateTo('/login');
    }
};
</script>
