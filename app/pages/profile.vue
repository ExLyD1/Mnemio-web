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
                        :aria-label="t('profile.changePhoto')"
                        @click="avatarInput?.click()"
                    >
                        <Camera class="size-4" />
                    </button>
                </div>
                <h1 class="mt-4 font-display text-h2 text-cream">
                    {{ name || t('profile.yourProfile') }}
                </h1>
                <p v-if="handle" class="text-small text-brand-muted">@{{ handle }}</p>
                <p
                    class="mt-2 inline-block rounded-full border border-line-strong px-3 py-1 text-small text-brand-muted"
                >
                    {{ t('profile.memberSince').replace('{year}', String(memberYear)) }}
                </p>
                <div
                    v-if="prefs.learningLanguages.length"
                    class="mt-4 flex flex-wrap justify-center gap-1.5"
                >
                    <SharedPill v-for="l in prefs.learningLanguages" :key="l" tone="plum">{{
                        l
                    }}</SharedPill>
                </div>
                <UiButton variant="ghost" class="mt-5 w-full" @click="tab = 'edit'">{{
                    t('profile.editProfile')
                }}</UiButton>
            </div>

            <div class="rounded-[20px] border border-line bg-bg-surface p-5">
                <p class="mb-3 text-eyebrow uppercase text-brand-muted">
                    {{ t('profile.atAGlance') }}
                </p>
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

            <!-- Edit -->
            <template v-if="tab === 'edit'">
                <div
                    class="flex flex-col gap-4 rounded-[20px] border border-line bg-bg-surface p-6"
                >
                    <p class="text-eyebrow uppercase text-brand-muted">
                        {{ t('profile.personalInfo') }}
                    </p>
                    <UiInputField
                        v-model="draft.fullName"
                        :label="t('profile.fullName')"
                        :placeholder="t('profile.fullNamePlaceholder')"
                    />
                    <UiInputField
                        v-model="draft.username"
                        :label="t('profile.username')"
                        :placeholder="t('profile.usernamePlaceholder')"
                    />
                    <UiInputField
                        v-model="draft.birthday"
                        type="date"
                        :label="t('profile.birthday')"
                    />
                    <UiSelect
                        v-model="draft.nativeLanguage"
                        :label="t('profile.nativeLanguage')"
                        :options="languageOptions"
                    />
                    <div>
                        <span class="mb-1.5 block text-small text-brand-muted">{{
                            t('profile.learning')
                        }}</span>
                        <UiChipInput
                            v-model="draft.learning"
                            :placeholder="t('profile.learningPlaceholder')"
                        />
                    </div>
                </div>

                <div class="rounded-[20px] border border-line bg-bg-surface p-6">
                    <p class="mb-3 text-eyebrow uppercase text-brand-muted">
                        {{ t('profile.dailyGoal') }}
                    </p>
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
                        {{ dirty ? t('profile.unsaved') : t('profile.upToDate') }}
                    </p>
                    <UiButton
                        variant="primary"
                        :disabled="!dirty || updateProfile.loading.value"
                        @click="onSave"
                    >
                        <UiSpinner v-if="updateProfile.loading.value" size="sm" class="mr-2" />
                        {{ t('profile.saveChanges') }}
                    </UiButton>
                </div>
            </template>

            <!-- Achievements -->
            <template v-else-if="tab === 'achievements'">
                <div class="rounded-[20px] border border-line bg-bg-surface p-5">
                    <div class="mb-4 flex items-center justify-between">
                        <p class="text-eyebrow uppercase text-brand-muted">
                            {{ t('profile.achievements') }}
                        </p>
                        <p class="text-small text-brand-muted">
                            {{
                                t('profile.earned')
                                    .replace('{x}', String(earnedCount))
                                    .replace('{y}', String(achievements.items.value.length))
                            }}
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
                            <span class="text-small font-semibold text-cream">{{
                                achName(a)
                            }}</span>
                            <span class="text-small text-brand-muted">{{ achDesc(a) }}</span>
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
import type { Achievement } from '@/types/achievement';

definePageMeta({ layout: 'default' });

const auth = useAuthStore();
const { updateProfile } = useAuth();
const { store, fetchList } = useDecks();
const prefs = usePreferencesStore();
const stats = useStats();
const achievements = useAchievements();
const toast = useToast();
const { t } = useT();

useSeo({ title: t('seo.profileTitle'), description: t('seo.appDesc'), noindex: true });

const avatarInput = ref<HTMLInputElement | null>(null);
const onAvatar = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
        await uploadMedia('avatar', file);
        await auth.hydrate();
        toast.success(t('profile.photoUpdated'));
    } catch {
        toast.error(t('profile.photoError'));
    }
};

const tab = ref('edit');
const tabs = computed(() => [
    { value: 'edit', label: t('profile.editProfile') },
    { value: 'achievements', label: t('profile.achievements') },
]);

const languageOptions = LANGUAGES.map((l) => ({ value: l.code, label: l.label }));
const goalOptions = computed(() => [
    { value: 'casual', label: t('profile.goalCasual'), note: t('profile.goalCasualNote') },
    { value: 'steady', label: t('profile.goalSteady'), note: t('profile.goalSteadyNote') },
    { value: 'serious', label: t('profile.goalSerious'), note: t('profile.goalSeriousNote') },
]);

const name = computed(() => auth.currentUser?.displayName ?? auth.currentUser?.username ?? '');
const handle = computed(() => auth.currentUser?.username ?? '');
const memberYear = computed(() =>
    auth.currentUser?.createdAt
        ? new Date(auth.currentUser.createdAt).getFullYear()
        : new Date().getFullYear(),
);

const heat = computed(() => stats.yearHeat.value);
const earnedCount = computed(() => achievements.items.value.filter((a) => a.earned).length);

// Backend ships English name/description; map by the stable `key` to the catalog
// (falls back to the server text for any key we haven't translated yet).
const achName = (a: Achievement) => t(`achievements.${a.key}.name`, a.name);
const achDesc = (a: Achievement) => t(`achievements.${a.key}.description`, a.description);

const daysPracticed = computed(() => stats.series.value.filter((p) => p.value > 0).length);

const quickStats = computed(() => [
    { label: t('profile.statDaysPracticed'), value: daysPracticed.value },
    { label: t('profile.statReviewed'), value: stats.reviewed.value },
    { label: t('profile.statDecks'), value: store.summaries.length },
    { label: t('profile.statRetention'), value: `${stats.retention.value}%` },
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
            toast.error(updateProfile.error.value?.message ?? t('profile.saveError'));
            return;
        }
    }

    await prefs.update({
        nativeLanguage: draft.nativeLanguage,
        learningLanguages: [...draft.learning],
        goal: draft.goal,
    });
    toast.success(t('profile.saved'));
    syncDraft();
};

watch(() => auth.currentUser, syncDraft, { immediate: true });

onMounted(async () => {
    await Promise.all([
        fetchList.execute({ cursor: null, append: false }),
        stats.load(),
        stats.loadSeries('7'),
        achievements.load(),
        prefs.hydrate().catch(() => {}),
    ]);
    syncDraft();
});
</script>
