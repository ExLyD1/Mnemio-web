<template>
    <form novalidate @submit.prevent="onSubmit">
        <h2 class="mb-3 text-h2 font-bold text-neutral-0">{{ t('auth.verifyTitle') }}</h2>
        <p class="mb-8 text-body text-brand-muted">
            {{ t('auth.verifyHint') }}
            <strong class="text-brand-pale">{{ maskedEmail }}</strong
            >. {{ t('auth.verifySpamHint') }}
        </p>

        <UiInputOtp v-model="code" class="mb-2" />
        <p v-if="error" class="mb-4 text-small text-error" aria-live="polite">
            {{ t(error) }}
        </p>

        <p class="mb-8 text-body text-brand-muted">
            Didn't get it?
            <button type="button" class="text-accent transition-colors hover:underline">
                {{ t('auth.resend') }}
            </button>
        </p>

        <UiButton
            type="submit"
            variant="light"
            class="w-full rounded-xl py-4 text-body font-bold"
            :disabled="loading"
        >
            <UiSpinner v-if="loading" size="sm" class="mr-2" />
            {{ t('auth.confirm') }}
        </UiButton>
    </form>
</template>

<script setup lang="ts">
import { otpSchema } from '@/schemas/auth';
import { useT } from '@/composables/useT';

const props = withDefaults(defineProps<{ email: string; loading?: boolean }>(), {
    loading: false,
});
const emit = defineEmits<{ submit: [payload: { code: string }] }>();

const { t } = useT();
const code = ref('');
const error = ref<string | null>(null);

const maskedEmail = computed(() => {
    const [local, domain] = props.email.split('@');
    if (!domain) return props.email;
    return `${local!.slice(0, 2)}***@${domain}`;
});

const onSubmit = () => {
    const result = otpSchema.safeParse({ code: code.value });
    if (!result.success) {
        error.value = result.error.issues[0]?.message ?? 'auth.errors.code_invalid';
        return;
    }
    error.value = null;
    emit('submit', { code: code.value });
};
</script>
