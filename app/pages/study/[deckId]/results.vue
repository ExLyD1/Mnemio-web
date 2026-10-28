<template>
    <section
        v-if="!result"
        class="mx-auto flex min-h-screen max-w-2xl flex-col items-center gap-8 p-8 text-center"
    >
        <UiEmptyState :title="t('study.noResultsTitle')" :message="t('study.noResultsMessage')">
            <template #action>
                <UiButton variant="primary" @click="navigateTo(`/decks/${deckId}`)">
                    {{ t('study.backToDeck') }}
                </UiButton>
            </template>
        </UiEmptyState>
    </section>

    <section v-else class="flex min-h-screen flex-col font-sans text-cream">
        <header
            class="flex shrink-0 items-center justify-between gap-4 border-b border-line px-4 py-[18px] sm:px-8"
        >
            <div class="flex min-w-0 items-center gap-3.5">
                <SharedBrandMark :with-word="false" class="shrink-0 [&_img]:size-7" />
                <span aria-hidden="true" class="h-5 w-px shrink-0 bg-line-strong" />
                <p class="truncate font-display text-lg font-medium text-cream-dim">
                    {{ result.deckTitle }}
                </p>
            </div>
            <NuxtLink
                :to="`/decks/${deckId}`"
                :aria-label="t('study.close')"
                class="flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-line-strong text-xl text-cream-dim transition-colors hover:bg-bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple"
            >
                <span aria-hidden="true">×</span>
            </NuxtLink>
        </header>

        <div class="flex flex-1 items-center">
            <div
                class="mx-auto grid w-full max-w-[680px] grid-cols-[minmax(0,1fr)] items-center gap-[150px] px-4 pb-12 pt-[150px] sm:px-10 min-[1240px]:max-w-[1200px] min-[1240px]:grid-cols-[minmax(0,1fr)_620px] min-[1240px]:gap-20"
            >
                <div class="flex min-w-0 flex-col gap-5">
                    <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-cream-faint">
                        {{ t('study.sessionComplete') }}
                    </p>
                    <h1
                        class="text-balance break-words font-display text-[44px] font-medium leading-[1.08] tracking-[-0.02em] min-[1240px]:text-[60px]"
                    >
                        {{ resultHeading }}<template v-if="name">,<br />{{ name }}</template
                        >.
                    </h1>
                    <div class="mt-6 flex flex-wrap gap-3">
                        <NuxtLink
                            :to="`/study/${deckId}`"
                            class="inline-flex items-center justify-center gap-1 rounded-[14px] border border-line-strong bg-transparent px-[26px] py-[15px] text-base font-bold transition-colors hover:bg-bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple"
                        >
                            <span aria-hidden="true">↻</span> {{ t('study.studyAgain') }}
                        </NuxtLink>
                        <NuxtLink
                            :to="`/decks/${deckId}`"
                            class="inline-flex items-center justify-center rounded-[14px] border border-transparent bg-purple px-[26px] py-[15px] text-base font-bold text-on-accent transition-colors hover:bg-purple/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple"
                        >
                            {{ t('study.backToDeck') }}
                        </NuxtLink>
                    </div>
                </div>

                <div
                    class="relative min-w-0 rounded-3xl border border-line bg-bg-surface p-4 sm:p-8"
                >
                    <img
                        :src="`/images/mimi/${appearance.mascot}/peek-paws.svg`"
                        alt=""
                        class="mimi-img pointer-events-none absolute left-[calc(50%-75px)] top-[-123px] z-[2] w-[150px] max-w-none drop-shadow-[0_6px_10px_rgba(0,0,0,.25)]"
                    />
                    <dl class="grid grid-cols-2 gap-3.5">
                        <div
                            v-for="stat in stats"
                            :key="stat.key"
                            class="flex min-w-0 flex-col gap-2.5 rounded-2xl bg-bg-deep px-3 py-5 sm:px-[22px]"
                        >
                            <dt
                                class="text-xs font-bold uppercase tracking-[0.1em] text-cream-faint"
                            >
                                {{ stat.label }}
                            </dt>
                            <dd
                                class="break-words font-display text-[32px] font-medium leading-none tracking-[-0.01em] tabular-nums lining-nums sm:text-[44px]"
                            >
                                {{ stat.value
                                }}<small
                                    v-if="stat.suffix"
                                    class="text-[0.5em] font-normal text-cream-faint"
                                    >{{ stat.suffix }}</small
                                >
                            </dd>
                            <dd
                                :class="[
                                    'flex min-h-[23px] flex-wrap items-baseline justify-between gap-x-2 tabular-nums',
                                    { invisible: !previousResult },
                                ]"
                                :aria-hidden="!previousResult"
                            >
                                <span class="text-[15px] text-cream-faint">
                                    {{ t('study.was').replace('{value}', stat.previous) }}
                                </span>
                                <span
                                    :class="[
                                        'text-[13px] font-bold',
                                        stat.improved ? 'text-success' : 'text-cream-faint',
                                    ]"
                                >
                                    {{ stat.delta }}
                                </span>
                            </dd>
                        </div>
                    </dl>

                    <div class="mt-6 border-t border-line pt-6">
                        <p
                            class="inline-flex rounded-full border border-line-strong bg-bg-surface-2 px-4 py-[9px] text-sm font-bold"
                        >
                            {{ t('study.howItWent') }}
                        </p>
                        <div
                            class="mt-5 flex h-3 gap-0.5 overflow-hidden rounded-full bg-bg-muted"
                            aria-hidden="true"
                        >
                            <div
                                v-for="segment in visibleSegments"
                                :key="segment.label"
                                :class="segment.color"
                                :style="{ flex: segment.count }"
                            />
                        </div>
                        <ul class="mt-3.5 flex flex-wrap gap-5 text-sm text-cream-dim">
                            <li
                                v-for="segment in segments"
                                :key="segment.label"
                                class="flex items-center gap-[7px]"
                            >
                                <span
                                    :class="['size-2.5 shrink-0 rounded-full', segment.color]"
                                    aria-hidden="true"
                                />
                                {{ segment.label }}
                                <b class="font-bold text-cream">{{ segment.count }}</b>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { useAuthStore, useT } from '#imports';
import { useAppearanceStore } from '@/stores/appearance';
import { usePracticeStore } from '@/stores/practice';
import type { PracticeResultSummary } from '@/types/practice';

definePageMeta({ layout: 'study' });

const route = useRoute();
const deckId = computed(() => String(route.params.deckId));

const practiceStore = usePracticeStore();
const appearance = useAppearanceStore();
const auth = useAuthStore();
const { t } = useT();

useSeo({ title: t('seo.studyTitle'), description: t('seo.appDesc'), noindex: true });

const result = computed(() => practiceStore.lastResult);
const previousResult = computed(() => practiceStore.previousResult);
const name = computed(() => auth.currentUser?.displayName ?? auth.currentUser?.username ?? '');

type SessionSummary = Pick<PracticeResultSummary, 'reviewed' | 'correct' | 'timeMs'>;

const sessionAccuracy = (session: SessionSummary | null): number =>
    session && session.reviewed > 0 ? Math.round((session.correct / session.reviewed) * 100) : 0;
const secondsPerCard = (session: SessionSummary | null): number =>
    session && session.reviewed > 0 ? Math.round(session.timeMs / 1000 / session.reviewed) : 0;
const sessionSeconds = (session: SessionSummary | null): number =>
    Math.round((session?.timeMs ?? 0) / 1000);
const formatTime = (seconds: number): string =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
const signed = (value: number): string =>
    value === 0 ? '±0' : `${value > 0 ? '+' : '−'}${Math.abs(value)}`;

const accuracy = computed(() => sessionAccuracy(result.value));

// Keep the heading honest about how the session actually went.
const resultHeading = computed(() => {
    const acc = accuracy.value;
    if (acc >= 100) return t('study.resultPerfect');
    if (acc >= 75) return t('study.resultHigh');
    if (acc >= 40) return t('study.resultMid');
    return t('study.resultLow');
});

const stats = computed(() => {
    const current = result.value;
    const previous = previousResult.value;
    const recalledDelta = (current?.correct ?? 0) - (previous?.correct ?? 0);
    const accuracyDelta = accuracy.value - sessionAccuracy(previous);
    const seconds = secondsPerCard(current);
    const secondsDelta = seconds - secondsPerCard(previous);
    const time = sessionSeconds(current);
    const timeDelta = time - sessionSeconds(previous);
    const secondsUnit = t('study.secondsShort');
    return [
        {
            key: 'recalled',
            label: t('study.recalled'),
            value: current?.correct ?? 0,
            suffix: ` / ${current?.reviewed ?? 0}`,
            previous: `${previous?.correct ?? 0} / ${previous?.reviewed ?? 0}`,
            delta: t('study.deltaCards', Math.abs(recalledDelta), { value: signed(recalledDelta) }),
            improved: recalledDelta > 0,
        },
        {
            key: 'accuracy',
            label: t('study.accuracy'),
            value: accuracy.value,
            suffix: '%',
            previous: `${sessionAccuracy(previous)}%`,
            delta: `${signed(accuracyDelta)}%`,
            improved: accuracyDelta > 0,
        },
        {
            key: 'seconds',
            label: t('study.secPerCard'),
            value: seconds,
            suffix: ` ${secondsUnit}`,
            previous: `${secondsPerCard(previous)} ${secondsUnit}`,
            delta: t('study.deltaSeconds', Math.abs(secondsDelta), { value: signed(secondsDelta) }),
            improved: secondsDelta < 0,
        },
        {
            key: 'time',
            label: t('study.time'),
            value: formatTime(time),
            suffix: '',
            previous: formatTime(sessionSeconds(previous)),
            delta:
                timeDelta === 0
                    ? '±0'
                    : `${timeDelta > 0 ? '+' : '−'}${formatTime(Math.abs(timeDelta))}`,
            improved: timeDelta < 0,
        },
    ];
});

// SharedBreakdownBar is also used elsewhere; this variant needs different spacing and colors.
const segments = computed(() => {
    const counts = result.value?.counts ?? { again: 0, hard: 0, good: 0, easy: 0 };
    return [
        { label: t('study.unknown'), count: counts.again, color: 'bg-error-soft' },
        { label: t('review.hard'), count: counts.hard, color: 'bg-warn' },
        { label: t('review.good'), count: counts.good, color: 'bg-purple' },
        { label: t('review.easy'), count: counts.easy, color: 'bg-stat-1' },
    ];
});
const visibleSegments = computed(() => segments.value.filter((segment) => segment.count > 0));
</script>
