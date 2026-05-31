<template>
    <form class="w-full max-w-[500px]" novalidate @submit="onSubmit">
        <div class="mb-5 h-[10px] w-full overflow-hidden rounded-[10px] bg-[#8E7592]">
            <span class="block h-full w-1/2 rounded-[10px] bg-[#CEB2BE]" />
        </div>

        <div class="flex flex-col items-center text-[#E3D2C8]">
            <h2 class="mb-3 text-h2 font-bold">{{ t('auth.detailsTitle') }}</h2>

            <div class="mb-5 size-10 rounded-full border-3 border-[#8E7592] bg-[#E3D2C8]" />

            <div class="flex w-full flex-col gap-[20px]">
                <div>
                    <UiInputField
                        v-model="fullName"
                        :label="t('auth.fullName')"
                        type="text"
                        :placeholder="t('auth.fullNamePlaceholder')"
                    />
                    <p v-if="fullNameError" class="mt-1.5 text-small text-error" aria-live="polite">
                        {{ t(fullNameError) }}
                    </p>
                </div>

                <div>
                    <UiInputField
                        v-model="username"
                        :label="t('auth.username')"
                        type="text"
                        :placeholder="t('auth.usernamePlaceholder')"
                    />
                    <p v-if="usernameError" class="mt-1.5 text-small text-error" aria-live="polite">
                        {{ t(usernameError) }}
                    </p>
                </div>

                <div>
                    <UiInputField
                        v-model="birthday"
                        :label="t('auth.birthday')"
                        type="date"
                        :placeholder="t('auth.birthdayPlaceholder')"
                        :max="todayIso"
                    />
                    <p v-if="birthdayError" class="mt-1.5 text-small text-error" aria-live="polite">
                        {{ t(birthdayError) }}
                    </p>
                </div>
            </div>

            <UiButton
                type="submit"
                variant="light"
                class="mt-6 w-full rounded-xl py-4 text-body font-bold"
                :disabled="loading"
            >
                <UiSpinner v-if="loading" size="sm" class="mr-2" />
                {{ t('auth.next') }}
            </UiButton>
        </div>
    </form>
</template>

<script setup lang="ts">
import { useForm, useField } from 'vee-validate';
import { accountDetailsSchema } from '@/schemas/auth';
import { toFormValidator } from '@/utils/zodValidator';
import { useT } from '@/composables/useT';

withDefaults(defineProps<{ loading?: boolean }>(), { loading: false });
const emit = defineEmits<{
    submit: [payload: { fullName: string; username: string; birthday: string }];
}>();

const { t } = useT();

const { handleSubmit } = useForm({
    validationSchema: toFormValidator(accountDetailsSchema),
    initialValues: { fullName: '', username: '', birthday: '' },
});

const { value: fullName, errorMessage: fullNameError } = useField<string>('fullName');
const { value: username, errorMessage: usernameError } = useField<string>('username');
const { value: birthday, errorMessage: birthdayError } = useField<string>('birthday');

const todayIso = new Date().toISOString().slice(0, 10);

const onSubmit = handleSubmit((values) => emit('submit', values));
</script>
