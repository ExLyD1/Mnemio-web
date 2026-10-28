<template>
    <div
        class="mx-auto grid max-w-[1080px] gap-10 px-5 py-12 md:grid-cols-[minmax(0,1fr)_300px] md:px-12 md:py-16"
    >
        <div>
            <NuxtLink
                to="/pricing"
                class="mb-8 inline-flex items-center gap-2 text-small text-brand-muted hover:text-cream"
            >
                <ChevronLeft class="size-4" /> {{ t('refunds.backToPricing') }}
            </NuxtLink>
            <h1 class="font-display text-[40px] leading-none md:text-[56px] text-cream">
                {{ t('refunds.title') }}
            </h1>
            <p class="mt-2 text-small text-brand-muted">{{ t('refunds.updated') }}</p>
            <div class="mt-10 flex flex-col gap-8 text-body text-cream-dim">
                <section>
                    <h2 class="mb-3 font-display text-[22px] text-cream">
                        {{ t('refunds.s1Title') }}
                    </h2>
                    <p>{{ t('refunds.s1Body') }}</p>
                </section>
                <section>
                    <h2 class="mb-3 font-display text-[22px] text-cream">
                        {{ t('refunds.s2Title') }}
                    </h2>
                    <p>{{ t('refunds.s2Body') }}</p>
                </section>
                <section>
                    <h2 class="mb-3 font-display text-[22px] text-cream">
                        {{ t('refunds.s3Title') }}
                    </h2>
                    <p>{{ t('refunds.s3Body') }}</p>
                </section>
                <section>
                    <h2 class="mb-3 font-display text-[22px] text-cream">
                        {{ t('refunds.s4Title') }}
                    </h2>
                    <p>{{ t('refunds.s4Body') }}</p>
                </section>
                <section>
                    <h2 class="mb-3 font-display text-[22px] text-cream">
                        {{ t('refunds.s5Title') }}
                    </h2>
                    <p>
                        {{ t('refunds.s5Body') }}
                        <a :href="`mailto:${SUPPORT_EMAIL}`" class="text-accent hover:underline">{{
                            SUPPORT_EMAIL
                        }}</a
                        >{{ t('refunds.s5Tail') }}
                    </p>
                </section>
            </div>
        </div>
        <aside
            class="self-start rounded-[24px] border border-line bg-bg-surface p-6 md:sticky md:top-8"
        >
            <h2 class="font-display text-[40px] leading-none text-cream">
                {{ t('refunds.asideTitle') }}
            </h2>
            <p class="mt-4 text-body text-cream-dim">{{ t('refunds.asideBody') }}</p>
            <a
                href="mailto:hello@mnemio.xyz?subject=Refund%20request"
                class="mt-6 flex min-h-11 items-center justify-center rounded-[14px] bg-purple px-5 py-3.5 font-bold text-on-accent"
                >{{ t('refunds.request') }}</a
            >
            <p class="mt-3 text-small text-cream-faint">{{ t('refunds.reply') }}</p>
        </aside>
    </div>
</template>

<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next';
import { useT } from '#imports';
import { SUPPORT_EMAIL } from '@/utils/contact';

definePageMeta({ layout: 'auth' });

const { t } = useT();

useSeo({ title: t('seo.refundsTitle'), description: t('seo.refundsDesc') });
</script>
