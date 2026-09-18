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
                        class="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full bg-brand text-on-color shadow-soft-elevation transition-transform hover:scale-105"
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
                        langName(l)
                    }}</SharedPill>
                </div>
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
                        :min="minBirthday"
                        :max="maxBirthday"
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
                        <UiSelect
                            :model-value="''"
                            :options="learningAddOptions"
                            :placeholder="t('profile.learningPlaceholder')"
                            @update:model-value="addLearning"
                        />
                        <div v-if="draft.learning.length" class="mt-2 flex flex-wrap gap-1.5">
                            <button
                                v-for="code in draft.learning"
                                :key="code"
                                type="button"
                                class="inline-flex items-center gap-1 rounded-full border border-line-strong px-2.5 py-1 text-small text-cream-dim transition-colors hover:border-brand-muted hover:text-cream"
                                @click="removeLearning(code)"
                            >
                                {{ langName(code) }}
                                <X class="size-3" />
                            </button>
                        </div>
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
                                    ? 'border-brand-bright bg-brand/10'
                                    : 'border-line bg-bg-surface-2 opacity-60',
                            ]"
                        >
                            <component
                                :is="a.earned ? Trophy : Lock"
                                class="size-7"
                                :class="a.earned ? 'text-vib-amber' : 'text-brand-muted'"
                            />
                            <span class="text-small font-semibold text-cream">{{
                                achName(a)
                            }}</span>
                            <span class="text-small text-brand-muted">{{ achDesc(a) }}</span>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Billing -->
            <template v-else-if="tab === 'billing'">
                <div class="rounded-[20px] border border-line bg-bg-surface p-6">
                    <div v-if="billingStore.loading" class="flex justify-center py-8">
                        <UiSpinner />
                    </div>

                    <template v-else-if="!billingStore.subscription">
                        <p class="text-eyebrow uppercase text-brand-muted">
                            {{ t('billing.settings.freePlan') }}
                        </p>
                        <p class="mt-2 text-body text-cream-dim">
                            {{ t('billing.settings.freeBody') }}
                        </p>
                        <div class="mt-6">
                            <NuxtLink to="/pricing">
                                <UiButton variant="primary">{{
                                    t('billing.settings.upgradeCta')
                                }}</UiButton>
                            </NuxtLink>
                        </div>
                    </template>

                    <template v-else>
                        <div class="flex items-center gap-3">
                            <span
                                :class="[
                                    'rounded-full px-3 py-1 text-small font-semibold',
                                    subStatusClass,
                                ]"
                            >
                                {{
                                    t(`billing.settings.status.${billingStore.subscription.status}`)
                                }}
                            </span>
                            <span class="text-body text-cream-dim">
                                {{ t(`billing.settings.plan.${billingStore.subscription.plan}`) }}
                            </span>
                        </div>

                        <div
                            v-if="billingStore.subscription.status === 'past_due'"
                            class="mt-4 rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-small text-error-soft"
                        >
                            {{ t('billing.settings.pastDueWarning') }}
                        </div>

                        <div class="mt-4 space-y-1 text-body text-cream-dim">
                            <p
                                v-if="
                                    billingStore.subscription.status === 'trialing' &&
                                    billingStore.subscription.trialEnd
                                "
                            >
                                {{
                                    t('billing.settings.trialEnds').replace(
                                        '{date}',
                                        fmtDate(billingStore.subscription.trialEnd),
                                    )
                                }}
                            </p>
                            <p
                                v-if="
                                    billingStore.subscription.status === 'active' ||
                                    billingStore.subscription.status === 'trialing'
                                "
                            >
                                {{
                                    t('billing.settings.renewsOn').replace(
                                        '{date}',
                                        fmtDate(billingStore.subscription.currentPeriodEnd),
                                    )
                                }}
                            </p>
                            <p
                                v-if="
                                    billingStore.subscription.status === 'canceled' ||
                                    billingStore.subscription.status === 'expired'
                                "
                            >
                                {{
                                    t('billing.settings.expiresOn').replace(
                                        '{date}',
                                        fmtDate(billingStore.subscription.currentPeriodEnd),
                                    )
                                }}
                            </p>
                            <p
                                v-if="billingStore.subscription.cancelAtPeriodEnd"
                                class="text-warn"
                            >
                                {{ t('billing.settings.cancelNote') }}
                            </p>
                        </div>

                        <div class="mt-6 flex flex-wrap gap-3">
                            <NuxtLink
                                v-if="
                                    billingStore.subscription.status === 'canceled' ||
                                    billingStore.subscription.status === 'expired'
                                "
                                to="/pricing"
                            >
                                <UiButton variant="primary">{{
                                    t('billing.settings.upgradeCta')
                                }}</UiButton>
                            </NuxtLink>
                            <template v-if="billingStore.notConfigured">
                                <p class="text-small text-cream-dim">
                                    {{ t('billing.settings.notConfigured') }}
                                </p>
                            </template>
                            <template v-else>
                                <UiButton
                                    variant="ghost"
                                    :disabled="billing.portal.loading.value"
                                    @click="billing.portal.execute()"
                                >
                                    <UiSpinner v-if="billing.portal.loading.value" size="sm" />
                                    {{ t('billing.settings.manageBilling') }}
                                </UiButton>
                            </template>
                        </div>
                    </template>
                </div>
            </template>

            <!-- Sign out — bottom of the page (was previously only reachable from the
                 mobile menu sheet; moved here so it's in one place on every viewport). -->
            <div class="border-t border-line pt-5">
                <UiButton
                    variant="ghost"
                    class="w-full justify-center !text-error-soft hover:!bg-error/10 hover:!text-error-soft"
                    @click="onSignOut"
                >
                    <LogOut class="size-4" />
                    {{ t('nav.signOut') }}
                </UiButton>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Trophy, Lock, Camera, X, LogOut } from 'lucide-vue-next';
import { useAuthStore, useAuth, useDecks, useToast, useT } from '#imports';
import { useBillingStore } from '@/stores/billing';
import { useBilling } from '@/composables/useBilling';
import { usePreferencesStore } from '@/stores/preferences';
import { useStats } from '@/composables/useStats';
import { useAchievements } from '@/composables/useAchievements';
import { uploadMedia } from '@/api/media';
import { mediaUrl } from '@/utils/media';
import { useLanguageName } from '@/composables/useLanguageName';
import { daysPracticedThisWeek, reviewedToday } from '@/utils/practiceWeek';
import { usernameErrorKey, usernameIssue } from '@/utils/username';
import { useAppLocale } from '@/composables/useAppLocale';
import type { ProfileUpdate } from '@/types/user';
import type { Achievement } from '@/types/achievement';

definePageMeta({ layout: 'default' });

const auth = useAuthStore();
const { updateProfile, logout } = useAuth();
const { store, fetchList } = useDecks();
const prefs = usePreferencesStore();
const stats = useStats();
const achievements = useAchievements();
const billingStore = useBillingStore();
const billing = useBilling();
const toast = useToast();
const { current: appLocale } = useAppLocale();
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

const onSignOut = async () => {
    await logout.execute();
    toast.success(t('auth.signedOut'));
    await navigateTo('/login');
};

// Deep-linkable so the notification bell can land straight on a tab, e.g.
// /profile?tab=achievements.
const route = useRoute();
const initialTab = route.query.tab === 'achievements' ? 'achievements' : 'edit';
const tab = ref(initialTab);
const tabs = computed(() => [
    { value: 'edit', label: t('profile.editProfile') },
    { value: 'achievements', label: t('profile.achievements') },
    { value: 'billing', label: t('billing.settings.tabLabel') },
]);

const { name: langName, options: languageOptions } = useLanguageName();
const learningAddOptions = computed(() =>
    languageOptions.value.filter((o) => !draft.learning.includes(o.value)),
);
const addLearning = (code: string) => {
    if (!code || draft.learning.includes(code)) return;
    draft.learning.push(code);
};
const removeLearning = (code: string) => {
    const i = draft.learning.indexOf(code);
    if (i !== -1) draft.learning.splice(i, 1);
};
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

// Same definitions as the dashboard and /statistics (utils/practiceWeek):
// "days practiced" = this Mon..Sun week, "reviewed today" = today's count.
// Previously these were a rolling-7-day count and the 30-day overview total
// shown under a "today" label (QA (2) #3, (3) #2).
const daysPracticed = computed(() => daysPracticedThisWeek(stats.series.value));
const reviewedTodayCount = computed(() => reviewedToday(stats.series.value));

const quickStats = computed(() => [
    { label: t('profile.statDaysPracticed'), value: daysPracticed.value },
    { label: t('profile.statReviewed'), value: reviewedTodayCount.value },
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

// Mirrors onboarding.vue's birthday constraints (and the backend's MIN_AGE_YEARS
// check in users.schema.ts) so the date picker itself can't offer a future date
// or one implying an age under 13, instead of only rejecting it after Save.
const minBirthday = '1900-01-01';
const maxBirthday = computed(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13);
    return d.toISOString().slice(0, 10);
});

const syncDraft = () => {
    draft.fullName = auth.currentUser?.displayName ?? '';
    draft.username = auth.currentUser?.username ?? '';
    draft.birthday = auth.currentUser?.birthday ?? '';
    // Preferences load asynchronously (boot-time plugin, or the hydrate() call
    // below) and default to null/[] before that resolves. Syncing those
    // defaults into the draft here would show "English / no languages" for a
    // moment - and if the user hits Save during that window, it gets PATCHed
    // to the server as their real choice, silently wiping their actual
    // preferences. Skip until prefs.loaded confirms real data is in.
    if (!prefs.loaded) {
        return;
    }
    draft.nativeLanguage = prefs.nativeLanguage ?? appLocale.value;
    draft.learning = [...prefs.learningLanguages];
    draft.goal = prefs.goal ?? 'steady';
};

const dirty = computed(
    () =>
        draft.fullName !== (auth.currentUser?.displayName ?? '') ||
        draft.username !== (auth.currentUser?.username ?? '') ||
        draft.birthday !== (auth.currentUser?.birthday ?? '') ||
        draft.nativeLanguage !== (prefs.nativeLanguage ?? appLocale.value) ||
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
        const issue = usernameIssue(username);
        if (issue) {
            toast.error(t(usernameErrorKey(issue)));
            return;
        }
        patch.username = username;
    }
    if (draft.birthday && draft.birthday !== (cur?.birthday ?? '')) {
        patch.birthday = draft.birthday;
    }

    if (Object.keys(patch).length > 0) {
        const result = await updateProfile.execute(patch);
        if (!result) {
            const err = updateProfile.error.value;
            toast.error(
                err?.code === 'AUTH_USERNAME_TAKEN'
                    ? t(usernameErrorKey('taken'))
                    : (err?.message ?? t('profile.saveError')),
            );
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

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

const subStatusClass = computed(() => {
    const s = billingStore.subscription?.status;
    if (s === 'active') return 'bg-success/15 text-success';
    if (s === 'trialing') return 'bg-brand/15 text-brand-bright';
    if (s === 'past_due') return 'bg-error/15 text-error-soft';
    if (s === 'canceled') return 'bg-warn/15 text-warn';
    return 'bg-bg-muted text-cream-dim';
});

watch(() => auth.currentUser, syncDraft, { immediate: true });
// Preferences can finish hydrating after this component's initial sync
// (see the prefs.loaded guard in syncDraft above) - catch that transition
// so the draft picks up the real language/goal values as soon as they land,
// without depending on auth.currentUser also changing around the same time.
watch(() => prefs.loaded, syncDraft);

onMounted(async () => {
    await Promise.all([
        fetchList.execute({ cursor: null, append: false }),
        stats.load(),
        stats.loadSeries('7'),
        achievements.load(),
        prefs.hydrate().catch(() => {}),
        billingStore.load(),
    ]);
    syncDraft();
});
</script>
