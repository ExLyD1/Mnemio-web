<template>
    <div>
        <!-- Hero -->
        <section class="mx-auto grid max-w-[1080px] items-center gap-10 px-6 py-20 lg:grid-cols-2">
            <div>
                <SharedPill tone="plum">
                    <Star class="size-3.5 fill-pink-soft text-pink-soft" />
                    {{ t('landing.heroBadge') }}
                </SharedPill>
                <h1 class="mt-5 font-display text-display text-cream">
                    {{ t('landing.heroTitle1')
                    }}<span class="italic">{{ t('landing.heroTitleEm') }}</span
                    >{{ t('landing.heroTitle2') }}
                </h1>
                <p class="mt-5 max-w-[46ch] text-body font-medium text-cream">
                    {{ t('landing.heroBody') }}
                </p>
                <div class="mt-7 flex flex-wrap gap-3">
                    <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                        {{ t('landing.ctaGetStartedFree') }}
                    </UiButton>
                    <UiButton variant="ghost" @click="scrollTo('#how')">{{
                        t('landing.ctaSeeHow')
                    }}</UiButton>
                </div>
            </div>

            <div class="relative grid place-items-center py-8">
                <div class="card-stack relative h-[260px] w-[320px]">
                    <div
                        v-for="(c, i) in heroCards"
                        :key="i"
                        class="absolute inset-0 flex flex-col justify-between rounded-2xl border border-line-strong bg-plum-card p-6 shadow-flash-card"
                        :style="stackStyle(i)"
                    >
                        <SharedPill tone="plum">{{ c.lang }}</SharedPill>
                        <p class="font-display text-3xl text-cream">{{ c.front }}</p>
                        <span class="text-small text-brand-muted">{{ c.tag }}</span>
                    </div>
                </div>
                <SharedMimi :size="120" class="absolute -bottom-2 -right-2" />
            </div>
        </section>

        <!-- Features -->
        <section id="features" class="mx-auto max-w-[1080px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">
                {{ t('landing.featuresEyebrow') }}
            </p>
            <h2 class="mt-2 max-w-[20ch] font-display text-h1 text-cream">
                {{ t('landing.featuresTitle') }}
            </h2>
            <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div
                    v-for="f in features"
                    :key="f.title"
                    class="rounded-[20px] border border-line bg-bg-surface p-6 transition-all hover:shadow-lg hover:shadow-brand/10"
                >
                    <span
                        class="grid size-11 place-items-center rounded-xl bg-brand/30 text-lavender"
                    >
                        <component :is="f.icon" class="size-5" />
                    </span>
                    <h3 class="mt-4 font-display text-h3 text-cream">{{ t(f.title) }}</h3>
                    <p class="mt-2 text-small text-cream">{{ t(f.body) }}</p>
                </div>
            </div>
        </section>

        <!-- How it works -->
        <section id="how" class="mx-auto max-w-[1080px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">{{ t('landing.howEyebrow') }}</p>
            <h2 class="mt-2 font-display text-h1 text-cream">{{ t('landing.howTitle') }}</h2>
            <div class="mt-10 grid gap-5 sm:grid-cols-3">
                <div
                    v-for="(s, i) in steps"
                    :key="s.title"
                    class="rounded-[20px] border border-line bg-bg-surface p-6"
                >
                    <span class="font-display text-4xl text-brand-bright">{{ i + 1 }}</span>
                    <h3 class="mt-3 font-display text-h3 text-cream">{{ t(s.title) }}</h3>
                    <p class="mt-2 text-small text-cream">{{ t(s.body) }}</p>
                </div>
            </div>
        </section>

        <!-- Interactive demo -->
        <section id="demo" class="border-y border-line bg-bg-surface/40">
            <div class="mx-auto max-w-[1080px] px-6 py-16">
                <div class="mb-8 text-center">
                    <p class="text-eyebrow uppercase text-brand-muted">
                        {{ t('landing.demoEyebrow') }}
                    </p>
                    <h2 class="mt-2 font-display text-h1 text-cream">
                        {{ t('landing.demoTitle') }}
                    </h2>
                </div>
                <LandingDemo />
            </div>
        </section>

        <!-- AI companion -->
        <section
            id="ai"
            class="mx-auto grid max-w-[1080px] items-center gap-10 px-6 py-16 lg:grid-cols-2"
        >
            <div>
                <p class="text-eyebrow uppercase text-brand-muted">{{ t('landing.aiEyebrow') }}</p>
                <h2 class="mt-2 font-display text-h1 text-cream">
                    {{ t('landing.aiTitle') }}
                </h2>
                <p class="mt-4 max-w-[44ch] text-body text-cream">
                    {{ t('landing.aiBody') }}
                </p>
            </div>
            <div class="flex flex-col gap-3 rounded-[20px] border border-line bg-bg-surface p-6">
                <div
                    class="max-w-[80%] self-start rounded-2xl rounded-bl-sm border border-line-strong bg-bg-surface-2 px-4 py-3 text-body text-cream"
                >
                    {{ t('landing.aiBubble1') }}
                </div>
                <div
                    class="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-brand px-4 py-3 text-body text-on-color"
                >
                    {{ t('landing.aiBubble2') }}
                </div>
                <div class="flex items-center gap-2 self-start text-small text-brand-muted">
                    <span class="size-1.5 animate-typing-dot rounded-full bg-brand-pale" />
                    <span
                        class="size-1.5 animate-typing-dot rounded-full bg-brand-pale [animation-delay:0.2s]"
                    />
                    <span
                        class="size-1.5 animate-typing-dot rounded-full bg-brand-pale [animation-delay:0.4s]"
                    />
                </div>
            </div>
        </section>

        <!-- Stats -->
        <section class="mx-auto max-w-[1080px] px-6 py-12">
            <div
                class="grid grid-cols-2 gap-6 rounded-[20px] border border-line bg-bg-surface p-8 sm:grid-cols-4"
            >
                <div v-for="s in stats" :key="s.label" class="text-center">
                    <p class="font-display text-h1 text-cream">{{ t(s.value) }}</p>
                    <p class="mt-1 text-small text-brand-muted">{{ t(s.label) }}</p>
                </div>
            </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="mx-auto max-w-[760px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">{{ t('landing.faqEyebrow') }}</p>
            <h2 class="mt-2 font-display text-h1 text-cream">{{ t('landing.faqTitle') }}</h2>
            <div class="mt-8 flex flex-col gap-4">
                <div
                    v-for="item in faqs"
                    :key="item.q"
                    class="rounded-[20px] border border-line bg-bg-surface p-6"
                >
                    <h3 class="font-display text-h3 text-cream">{{ t(item.q) }}</h3>
                    <p class="mt-2 text-body text-cream">{{ t(item.a) }}</p>
                </div>
            </div>
        </section>

        <!-- Final CTA -->
        <section class="mx-auto max-w-[1080px] px-6 pb-24 pt-10">
            <div class="rounded-[28px] bg-mimi-ambient p-12 text-center">
                <h2 class="font-display text-display-sm text-cream">
                    {{ t('landing.finalCtaTitle1')
                    }}<span class="italic">{{ t('landing.finalCtaTitleEm') }}</span>
                </h2>
                <p class="mx-auto mt-3 max-w-[44ch] text-body text-cream">
                    {{ t('landing.finalCtaBody') }}
                </p>
                <div class="mt-6 flex justify-center gap-3">
                    <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                        {{ t('landing.ctaGetStartedFree') }}
                    </UiButton>
                    <UiButton variant="ghost" @click="navigateTo('/discover')">
                        {{ t('landing.ctaExplore') }}
                    </UiButton>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { Star, Upload, Wand2, Brain, Image, Flame, WifiOff } from 'lucide-vue-next';
import { useHead, useT } from '#imports';
import { SAMPLE_DECK } from '@/composables/useSampleDeck';

definePageMeta({ layout: 'marketing' });

const { t } = useT();

useSeo({ title: t('seo.homeTitle'), description: t('seo.homeDesc') });

const faqs = [
    { q: 'landing.faq1Q', a: 'landing.faq1A' },
    { q: 'landing.faq2Q', a: 'landing.faq2A' },
    { q: 'landing.faq3Q', a: 'landing.faq3A' },
    { q: 'landing.faq4Q', a: 'landing.faq4A' },
];

// Landing-page software + FAQ schema, in addition to the Organization/WebSite graph
// emitted by the marketing layout. The FAQ entries mirror the visible #faq section.
useHead({
    script: [
        {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                name: 'Mnemio',
                applicationCategory: 'EducationApplication',
                operatingSystem: 'Web',
                description: t('seo.homeDesc'),
                offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
        },
        {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqs.map((f) => ({
                    '@type': 'Question',
                    name: t(f.q),
                    acceptedAnswer: { '@type': 'Answer', text: t(f.a) },
                })),
            }),
        },
    ],
});

const heroCards = SAMPLE_DECK.slice(0, 3);

const stackStyle = (i: number) => ({
    transform: `translateY(${i * -14}px) translateX(${i * 10}px) rotate(${(i - 1) * 4}deg)`,
    zIndex: String(heroCards.length - i),
    opacity: String(1 - i * 0.12),
});

const features = [
    { icon: Upload, title: 'landing.feat1Title', body: 'landing.feat1Body' },
    { icon: Wand2, title: 'landing.feat2Title', body: 'landing.feat2Body' },
    { icon: Brain, title: 'landing.feat3Title', body: 'landing.feat3Body' },
    { icon: Image, title: 'landing.feat4Title', body: 'landing.feat4Body' },
    { icon: Flame, title: 'landing.feat5Title', body: 'landing.feat5Body' },
    { icon: WifiOff, title: 'landing.feat6Title', body: 'landing.feat6Body' },
];

const steps = [
    { title: 'landing.step1Title', body: 'landing.step1Body' },
    { title: 'landing.step2Title', body: 'landing.step2Body' },
    { title: 'landing.step3Title', body: 'landing.step3Body' },
];

const stats = [
    { value: 'landing.stat1Value', label: 'landing.stat1Label' },
    { value: 'landing.stat2Value', label: 'landing.stat2Label' },
    { value: 'landing.stat3Value', label: 'landing.stat3Label' },
    { value: 'landing.stat4Value', label: 'landing.stat4Label' },
];

const scrollTo = (sel: string) => {
    document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' });
};
</script>

<style scoped>
@keyframes floaty {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10px);
    }
}
.card-stack > div:first-child {
    animation: floaty 5s ease-in-out infinite;
}
</style>
