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
        <p class="mb-4 text-center text-small text-brand-muted">Step {{ step + 1 }} of 2</p>

        <div class="rounded-3xl border border-line-strong bg-bg-surface p-8 shadow-soft-elevation">
            <template v-if="step === 0">
                <h1 class="font-display text-h1 text-cream">Set up your profile</h1>
                <p class="mt-1 text-body text-cream-dim">
                    A few details so Mimi can greet you properly.
                </p>

                <div class="mt-6">
                    <span class="mb-2 block text-small text-brand-muted">Avatar</span>
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
                                :aria-label="`Avatar colour ${h}`"
                                @click="hue = h"
                            />
                        </div>
                    </div>
                </div>

                <div class="mt-5">
                    <UiInputField v-model="fullName" label="Full name" placeholder="Ada Lovelace" />
                </div>
                <div class="mt-4">
                    <UiInputField v-model="username" label="Username" placeholder="ada" />
                </div>
                <div class="mt-4">
                    <span class="mb-1 block text-small text-brand-muted">Birthday</span>
                    <input
                        v-model="birthday"
                        type="date"
                        :max="maxBirthday"
                        class="w-full rounded-xl border border-brand-muted bg-transparent px-4 py-2.5 text-body text-brand-pale outline-none focus:border-brand-bright"
                    />
                </div>

                <div class="mt-7 flex justify-end">
                    <UiButton variant="primary" @click="goStep2">Continue</UiButton>
                </div>
            </template>

            <template v-else>
                <h1 class="font-display text-h1 text-cream">What do you want to learn?</h1>
                <p class="mt-1 text-body text-cream-dim">Pick a few interests and a daily goal.</p>

                <div class="mt-6">
                    <span class="mb-2 block text-small text-brand-muted">Interests</span>
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
                            {{ topic }}
                        </button>
                    </div>
                </div>

                <div class="mt-6">
                    <span class="mb-2 block text-small text-brand-muted">Daily goal</span>
                    <UiRadioCards v-model="goal" :options="goalOptions" :columns="3" />
                </div>

                <div class="mt-7 flex justify-between">
                    <UiButton variant="ghost" @click="step = 0">Back</UiButton>
                    <UiButton
                        variant="primary"
                        :disabled="updateProfile.loading.value"
                        @click="finish"
                    >
                        <UiSpinner v-if="updateProfile.loading.value" size="sm" class="mr-2" />
                        Get started
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
import { useAuth, useToast } from '#imports';
import { usePreferencesStore } from '@/stores/preferences';
import { useMimi } from '@/composables/useMimi';

definePageMeta({ layout: 'auth' });

const { updateProfile } = useAuth();
const prefs = usePreferencesStore();
const mimi = useMimi();
const toast = useToast();

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

const goalOptions = [
    { value: 'casual', label: 'Casual', note: '5 cards / day' },
    { value: 'steady', label: 'Steady', note: '15 cards / day' },
    { value: 'serious', label: 'Serious', note: '30 cards / day' },
];

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
        say('I just need your name to get started 🙂');
        return;
    }
    if (username.value.trim().length < 3) {
        say('Pick a username with at least 3 characters.');
        return;
    }
    if (!birthday.value) {
        say('When’s your birthday? It helps me keep things age-appropriate.');
        return;
    }
    mimi.clear();
    step.value = 1;
};

const finish = async () => {
    if (!selectedInterests.value.length) {
        say('Choose at least one interest so I can suggest decks.');
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
    toast.success('Welcome to Mnemio!');
    await navigateTo('/dashboard');
};
</script>
