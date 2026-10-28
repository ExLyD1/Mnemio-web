<template>
    <template v-if="mobile">
        <button
            type="button"
            :class="triggerClass"
            :aria-label="t('topbar.account')"
            @click="open = true"
        >
            <UiAvatar :name="name" :src="mediaUrl(auth.user?.avatarUrl)" :size="38" />
        </button>
        <UiModal v-model="open" :title="t('topbar.account')" sheet
            ><AppAccountMenuContent @navigate="open = false"
        /></UiModal>
    </template>
    <UiPopover v-else align="right">
        <template #trigger="{ toggle }"
            ><button
                type="button"
                :class="triggerClass"
                :aria-label="t('topbar.account')"
                @click="toggle"
            >
                <UiAvatar :name="name" :src="mediaUrl(auth.user?.avatarUrl)" :size="38" /></button
        ></template>
        <template #default="{ close }"><AppAccountMenuContent @navigate="close" /></template>
    </UiPopover>
</template>
<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import { mediaUrl } from '@/utils/media';
const { t } = useT();
const auth = useAuthStore();
const { state, premium, store } = useSubscriptionView();
const mobile = useMediaQuery('(max-width: 767px)');
const open = ref(false);
const name = computed(() => auth.user?.displayName ?? auth.user?.username ?? '');
const triggerClass = computed(() => [
    'grid size-11 place-items-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:shadow-focus-ring',
    !store.notConfigured && state.value === 'past_due'
        ? 'ring-2 ring-error-soft'
        : !store.notConfigured && premium.value
          ? 'ring-2 ring-purple'
          : '',
]);
</script>
