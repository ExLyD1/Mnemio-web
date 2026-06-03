<template>
    <div class="w-full max-w-lg">
        <div class="mb-4 flex items-center justify-center gap-2">
            <span
                v-for="s in 2"
                :key="s"
                :class="[
                    'h-1.5 rounded-full transition-all',
                    s - 1 === step
                        ? 'w-8 bg-lavender'
                        : s - 1 < step
                          ? 'w-8 bg-brand'
                          : 'w-4 bg-line',
                ]"
            />
        </div>
        <p class="mb-4 text-center text-small text-brand-muted">
            {{ t('onboarding.stepOf').replace('{i}', String(step + 1)) }}
        </p>

        <div class="rounded-3xl border border-line-strong bg-bg-surface p-8 shadow-soft-elevation">
            <template v-if="step === 0">
                <h1 class="font-display text-h1 text-cream">{{ t('onboarding.profileTitle') }}</h1>
                <p class="mt-1 text-body text-cream-dim">
                    {{ t('onboarding.profileSubtitle') }}
                </p>

                <div class="mt-6">
                    <span class="mb-2 block text-small text-brand-muted">{{
                        t('onboarding.avatar')
                    }}</span>
                    <div class="flex items-center gap-4">
                        <UiAvatar :name="fullName || 'You'" :hue="hue" :size="56" />
                        <div class="flex gap-2">
                            <button
                                v-for="h in HUES"
                                :key="h"
                                type="button"
                                :class="[
                                    'size-8 rounded-full border-2 transition-colors',
                                    hue === h ? 'border-cream' : 'border-transparent',
                                ]"
                                :style="{ background: `hsl(${h} 42% 42%)` }"
                                :aria-label="t('onboarding.avatarColour').replace('{h}', String(h))"
                                @click="hue = h"
                            />
                        </div>
                    </div>
                </div>

                <div class="mt-5">
                    <UiInputField
                        v-model="fullName"
                        :label="t('onboarding.fullName')"
                        :placeholder="t('onboarding.fullNamePlaceholder')"
                    />
                </div>
                <div class="mt-4">
                    <UiInputField
                        v-model="username"
                        :label="t('onboarding.username')"
                        :placeholder="t('onboarding.usernamePlaceholder')"
                    />
                </div>
                <div class="mt-4">
                    <span class="mb-1 block text-small text-brand-muted">{{
                        t('onboarding.birthday')
                    }}</span>
                    <input
                        v-model="birthday"
                        type="date"
                        :max="maxBirthday"
                        class="w-full rounded-xl border border-brand-muted bg-transparent px-4 py-2.5 text-body text-brand-pale outline-none focus:border-brand-bright"
                    />
                </div>

                <div class="mt-7 flex justify-end">
                    <UiButton variant="primary" @click="goStep2">{{
                        t('common.continue')
                    }}</UiButton>
                </div>
            </template>

            <template v-else>
                <h1 class="font-display text-h1 text-cream">{{ t('onboarding.learnTitle') }}</h1>
                <p class="mt-1 text-body text-cream-dim">{{ t('onboarding.learnSubtitle') }}</p>

                <div class="mt-6">
                    <span class="mb-2 block text-small text-brand-muted">{{
                        t('onboarding.interests')
                    }}</span>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="topic in INTERESTS"
                            :key="topic"
                            type="button"
                            :class="[
                                'rounded-full border px-3.5 py-1.5 text-small font-semibold transition-colors',
                                selectedInterests.includes(topic)
                                    ? 'border-brand-bright bg-brand text-cream'
                                    : 'border-line-strong text-brand-muted hover:text-brand-pale',
                            ]"
                            @click="toggleInterest(topic)"
                        >
                            {{ t('onboarding.interestLabels.' + topic, topic) }}
                        </button>
                    </div>
                </div>

                <div class="mt-6">
                    <span class="mb-2 block text-small text-brand-muted">{{
                        t('onboarding.dailyGoal')
                    }}</span>
                    <UiRadioCards v-model="goal" :options="goalOptions" :columns="3" />
                </div>

                <div class="mt-7 flex justify-between">
                    <UiButton variant="ghost" @click="step = 0">{{ t('common.back') }}</UiButton>
                    <UiButton
                        variant="primary"
                        :disabled="updateProfile.loading.value"
                        @click="finish"
                    >
                        <UiSpinner v-if="updateProfile.loading.value" size="sm" class="mr-2" />
                        {{ t('onboarding.getStarted') }}
                    </UiButton>
                </div>
            </template>
        </div>

        <SharedMimi
            v-if="mimi.message.value"
            :message="mimi.message.value"
            :mood="mimi.mood.value"
            placement="left"
            :size="84"
            class="fixed bottom-6 left-6"
        />
    </div>
</template>

<script setup lang="ts">
import { useAuth, useToast, useT } from '#imports';
import { usePreferencesStore } from '@/stores/preferences';
import { useMimi } from '@/composables/useMimi';

definePageMeta({ layout: 'auth' });

const { updateProfile } = useAuth();
const prefs = usePreferencesStore();
const mimi = useMimi();
const toast = useToast();
const { t } = useT();

const HUES = [286, 210, 24, 140, 330];
const INTERESTS = [
    'Languages',
    'Science',
    'History',
    'Literature',
    'Medicine',
    'Law',
    'Programming',
    'Geography',
    'Art',
    'Music',
];

const goalOptions = computed(() => [
    { value: 'casual', label: t('onboarding.goalCasual'), note: t('onboarding.goalCasualNote') },
    { value: 'steady', label: t('onboarding.goalSteady'), note: t('onboarding.goalSteadyNote') },
    { value: 'serious', label: t('onboarding.goalSerious'), note: t('onboarding.goalSeriousNote') },
]);

const step = ref(0);
const hue = ref(prefs.avatarHue ?? 286);
const fullName = ref('');
const username = ref('');
const birthday = ref('');
const selectedInterests = ref<string[]>([...prefs.interests]);
const goal = ref(prefs.goal ?? 'steady');

const maxBirthday = computed(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().slice(0, 10);
});

const say = (message: string) => {
    mimi.mood.value = 'idle';
    mimi.message.value = message;
};

const toggleInterest = (topic: string) => {
    selectedInterests.value = selectedInterests.value.includes(topic)
        ? selectedInterests.value.filter((t) => t !== topic)
        : [...selectedInterests.value, topic];
};

const goStep2 = () => {
    if (fullName.value.trim().length < 1) {
        say(t('onboarding.errNeedName'));
        return;
    }
    if (username.value.trim().length < 3) {
        say(t('onboarding.errUsername'));
        return;
    }
    if (!birthday.value) {
        say(t('onboarding.errBirthday'));
        return;
    }
    mimi.clear();
    step.value = 1;
};

const finish = async () => {
    if (!selectedInterests.value.length) {
        say(t('onboarding.errInterest'));
        return;
    }
    const result = await updateProfile.execute({
        fullName: fullName.value.trim(),
        username: username.value.trim().toLowerCase(),
        birthday: birthday.value,
    });
    if (!result) {
        if (updateProfile.error.value) {
            toast.error(updateProfile.error.value.message);
        }
        return;
    }
    await prefs
        .update({
            avatarHue: hue.value,
            interests: [...selectedInterests.value],
            goal: goal.value,
        })
        .catch(() => {});
    toast.success(t('onboarding.welcome'));
    await navigateTo('/dashboard');
};
</script>
