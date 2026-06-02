<template>
    <section class="mx-auto grid max-w-6xl gap-6 p-8 lg:grid-cols-[300px_1fr]">
        <aside class="flex flex-col gap-5 self-start lg:sticky lg:top-6">
            <div class="rounded-[20px] border border-line bg-bg-surface p-6 text-center">
                <div class="relative mx-auto w-fit">
                    <UiAvatar
                        :name="name"
                        :src="mediaUrl(auth.currentUser?.avatarUrl)"
                        :hue="prefs.avatarHue ?? 286"
                        :size="96"
                    />
                    <input
                        ref="avatarInput"
                        type="file"
                        accept="image/*"
                        class="hidden"
                        @change="onAvatar"
                    />
                    <button
                        type="button"
                        class="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-brand text-cream shadow-soft-elevation transition-transform hover:scale-105"
                        aria-label="Change photo"
                        @click="avatarInput?.click()"
                    >
                        <Camera class="size-4" />
                    </button>
                </div>
                <h1 class="mt-4 font-display text-h2 text-cream">{{ name || 'Your profile' }}</h1>
                <p v-if="handle" class="text-small text-brand-muted">@{{ handle }}</p>
                <p
                    class="mt-2 inline-block rounded-full border border-line-strong px-3 py-1 text-small text-brand-muted"
                >
                    Member since {{ memberYear }}
                </p>
                <div
                    v-if="prefs.learningLanguages.length"
                    class="mt-4 flex flex-wrap justify-center gap-1.5"
                >
                    <SharedPill v-for="l in prefs.learningLanguages" :key="l" tone="plum">{{
                        l
                    }}</SharedPill>
                </div>
                <UiButton variant="ghost" class="mt-5 w-full" @click="tab = 'edit'"
                    >Edit profile</UiButton
                >
            </div>

            <div class="rounded-[20px] border border-line bg-bg-surface p-5">
                <p class="mb-3 text-eyebrow uppercase text-brand-muted">At a glance</p>
                <div class="flex flex-col divide-y divide-line">
                    <div
                        v-for="s in quickStats"
                        :key="s.label"
                        class="flex items-center justify-between py-2.5"
                    >
                        <span class="text-small text-brand-muted">{{ s.label }}</span>
                        <span class="font-display text-lg text-cream">{{ s.value }}</span>
                    </div>
                </div>
            </div>
        </aside>

        <div class="flex flex-col gap-5">
            <UiSegmentedControl v-model="tab" :options="tabs" />

            <!-- Overview -->
            <template v-if="tab === 'overview'">
                <div class="rounded-[20px] border border-line bg-bg-surface p-5">
                    <p class="mb-3 text-eyebrow uppercase text-brand-muted">Activity</p>
                    <SharedActivityHeatmap :weeks="heat" />
                </div>
                <div class="rounded-[20px] border border-line bg-bg-surface p-5">
                    <p class="mb-3 text-eyebrow uppercase text-brand-muted">Your decks</p>
                    <div v-if="store.summaries.length" class="flex flex-col gap-1">
                        <NuxtLink
                            v-for="d in store.summaries"
                            :key="d.id"
                            :to="`/decks/${d.id}`"
                            class="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
                        >
                            <span class="truncate font-display text-base text-cream">{{
                                d.title
                            }}</span>
                            <span class="w-28 shrink-0">
                                <SharedProgressBar :value="d.stats.masteredPct" />
                            </span>
                        </NuxtLink>
                    </div>
                    <p v-else class="text-body text-brand-muted">No decks yet.</p>
                </div>
            </template>

            <!-- Edit -->
            <template v-else-if="tab === 'edit'">
                <div
                    class="flex flex-col gap-4 rounded-[20px] border border-line bg-bg-surface p-6"
                >
                    <p class="text-eyebrow uppercase text-brand-muted">Personal info</p>
                    <UiInputField
                        v-model="draft.fullName"
                        label="Full name"
                        placeholder="Ada Lovelace"
                    />
                    <UiInputField v-model="draft.username" label="Username" placeholder="ada" />
                    <div>
                        <span class="mb-1 block text-small text-brand-muted">Birthday</span>
                        <input
                            v-model="draft.birthday"
                            type="date"
                            class="w-full rounded-xl border border-brand-muted bg-transparent px-4 py-2.5 text-body text-brand-pale outline-none focus:border-brand-bright"
                        />
                    </div>
                    <UiSelect
                        v-model="draft.nativeLanguage"
                        label="Native language"
                        :options="languageOptions"
                    />
                    <div>
                        <span class="mb-1.5 block text-small text-brand-muted">Learning</span>
                        <UiChipInput v-model="draft.learning" placeholder="Add a language…" />
                    </div>
                </div>

                <div class="rounded-[20px] border border-line bg-bg-surface p-6">
                    <p class="mb-3 text-eyebrow uppercase text-brand-muted">Daily goal</p>
                    <UiRadioCards v-model="draft.goal" :options="goalOptions" :columns="3" />
                </div>

                <div class="rounded-[20px] border border-line bg-bg-surface p-6">
                    <p class="mb-3 text-eyebrow uppercase text-brand-muted">
                        {{ t('common.language') }}
                    </p>
                    <SharedLanguageSwitcher variant="segmented" />
                </div>

                <div class="flex items-center justify-between">
                    <p class="text-small" :class="dirty ? 'text-brand-pale' : 'text-brand-muted'">
                        {{ dirty ? 'You have unsaved changes' : 'Everything is up to date' }}
                    </p>
                    <UiButton
                        variant="primary"
                        :disabled="!dirty || updateProfile.loading.value"
                        @click="onSave"
                    >
                        <UiSpinner v-if="updateProfile.loading.value" size="sm" class="mr-2" />
                        Save changes
                    </UiButton>
                </div>
            </template>

            <!-- Achievements -->
            <template v-else>
                <div class="rounded-[20px] border border-line bg-bg-surface p-5">
                    <div class="mb-4 flex items-center justify-between">
                        <p class="text-eyebrow uppercase text-brand-muted">Achievements</p>
                        <p class="text-small text-brand-muted">
                            {{ earnedCount }} of {{ achievements.items.value.length }} earned
                        </p>
                    </div>
                    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div
                            v-for="a in achievements.items.value"
                            :key="a.id"
                            :class="[
                                'flex flex-col items-center gap-2 rounded-2xl border p-5 text-center',
                                a.earned
                                    ? 'border-brand-bright bg-brand/20'
                                    : 'border-line bg-bg-surface-2 opacity-60',
                            ]"
                        >
                            <component
                                :is="a.earned ? Trophy : Lock"
                                class="size-7"
                                :class="a.earned ? 'text-pink-soft' : 'text-brand-muted'"
                            />
                            <span class="text-small font-semibold text-cream">{{ a.name }}</span>
                            <span class="text-small text-brand-muted">{{ a.note }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Trophy, Lock, Camera } from 'lucide-vue-next';
import { useAuthStore, useAuth, useDecks, useToast, useT } from '#imports';
import { usePreferencesStore } from '@/stores/preferences';
import { useStats } from '@/composables/useStats';
import { useAchievements } from '@/composables/useAchievements';
import { uploadMedia } from '@/api/media';
import { mediaUrl } from '@/utils/media';
import { LANGUAGES } from '@/schemas/deck';
import type { ProfileUpdate } from '@/types/user';

definePageMeta({ layout: 'default' });

const auth = useAuthStore();
const { updateProfile } = useAuth();
const { store, fetchList } = useDecks();
const prefs = usePreferencesStore();
const stats = useStats();
const achievements = useAchievements();
const toast = useToast();
const { t } = useT();

const avatarInput = ref<HTMLInputElement | null>(null);
const onAvatar = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
        await uploadMedia('avatar', file);
        await auth.hydrate();
        toast.success('Photo updated');
    } catch {
        toast.error('Could not upload photo');
    }
};

const tab = ref('overview');
const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'edit', label: 'Edit profile' },
    { value: 'achievements', label: 'Achievements' },
];

const languageOptions = LANGUAGES.map((l) => ({ value: l.code, label: l.label }));
const goalOptions = [
    { value: 'casual', label: 'Casual', note: '5 / day' },
    { value: 'steady', label: 'Steady', note: '15 / day' },
    { value: 'serious', label: 'Serious', note: '30 / day' },
];

const name = computed(() => auth.currentUser?.displayName ?? auth.currentUser?.username ?? '');
const handle = computed(() => auth.currentUser?.username ?? '');
const memberYear = computed(() =>
    auth.currentUser?.createdAt
        ? new Date(auth.currentUser.createdAt).getFullYear()
        : new Date().getFullYear(),
);

const heat = computed(() => stats.yearHeat.value);
const earnedCount = computed(() => achievements.items.value.filter((a) => a.earned).length);

const quickStats = computed(() => [
    { label: 'Streak', value: `${stats.streak.value}d` },
    { label: 'Reviewed today', value: stats.reviewed.value },
    { label: 'Decks', value: store.summaries.length },
    { label: 'Retention', value: `${stats.retention.value}%` },
]);

const draft = reactive({
    fullName: '',
    username: '',
    birthday: '',
    nativeLanguage: 'en',
    learning: [] as string[],
    goal: 'steady',
});

const syncDraft = () => {
    draft.fullName = auth.currentUser?.displayName ?? '';
    draft.username = auth.currentUser?.username ?? '';
    draft.birthday = auth.currentUser?.birthday ?? '';
    draft.nativeLanguage = prefs.nativeLanguage ?? 'en';
    draft.learning = [...prefs.learningLanguages];
    draft.goal = prefs.goal ?? 'steady';
};

const dirty = computed(
    () =>
        draft.fullName !== (auth.currentUser?.displayName ?? '') ||
        draft.username !== (auth.currentUser?.username ?? '') ||
        draft.birthday !== (auth.currentUser?.birthday ?? '') ||
        draft.nativeLanguage !== (prefs.nativeLanguage ?? 'en') ||
        JSON.stringify(draft.learning) !== JSON.stringify(prefs.learningLanguages) ||
        draft.goal !== (prefs.goal ?? 'steady'),
);

const onSave = async () => {
    const cur = auth.currentUser;
    const patch: ProfileUpdate = {};
    const fullName = draft.fullName.trim();
    const username = draft.username.trim().toLowerCase();
    if (fullName && fullName !== (cur?.displayName ?? '')) {
        patch.fullName = fullName;
    }
    if (username && username !== (cur?.username ?? '')) {
        patch.username = username;
    }
    if (draft.birthday && draft.birthday !== (cur?.birthday ?? '')) {
        patch.birthday = draft.birthday;
    }

    if (Object.keys(patch).length > 0) {
        const result = await updateProfile.execute(patch);
        if (!result) {
            toast.error(updateProfile.error.value?.message ?? 'Could not save profile');
            return;
        }
    }

    await prefs.update({
        nativeLanguage: draft.nativeLanguage,
        learningLanguages: [...draft.learning],
        goal: draft.goal,
    });
    toast.success('Profile saved');
    syncDraft();
};

watch(() => auth.currentUser, syncDraft, { immediate: true });

onMounted(async () => {
    await Promise.all([
        fetchList.execute({ cursor: null, append: false }),
        stats.load(),
        achievements.load(),
        prefs.hydrate().catch(() => {}),
    ]);
    syncDraft();
});
</script>
