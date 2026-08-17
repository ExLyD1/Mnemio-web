<template>
    <div>
        <section class="mx-auto max-w-[1080px] px-6 py-20 text-center">
            <p class="text-eyebrow uppercase text-brand-muted">Лексичний мінімум НМТ</p>
            <h1 class="mx-auto mt-2 max-w-[26ch] font-display text-display-sm text-cream">
                Лексичний мінімум з англійської мови —
                <span class="italic">картки для вивчення замість статичного PDF</span>
            </h1>
            <p class="mx-auto mt-4 max-w-[56ch] text-body text-cream-dim">
                Завантажте офіційний список лексичного мінімуму НМТ ({{ year }}) чи будь-який PDF зі
                словами — і Mnemio перетворить його на готову колоду карток з інтервальним
                повторенням, замість чергового файлу, який просто лежить непрочитаним.
            </p>
            <div class="mt-7 flex flex-wrap justify-center gap-3">
                <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                    Створити колоду безкоштовно
                </UiButton>
                <UiButton variant="ghost" @click="navigateTo('/discover')">
                    Переглянути публічні колоди
                </UiButton>
            </div>
        </section>

        <section class="mx-auto max-w-[880px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">Що це таке</p>
            <h2 class="mt-2 font-display text-h1 text-cream">
                Що таке лексичний мінімум з англійської мови
            </h2>
            <p class="mt-4 text-body text-cream-dim">
                Лексичний мінімум — це офіційний перелік слів і словосполучень, які учень має знати
                для успішного складання НМТ (та раніше — ЗНО) з англійської мови. Проблема в тому,
                що цей список зазвичай публікують як звичайний PDF або таблицю: його треба
                самостійно перечитувати й вручну виписувати картки, щоб дійсно запам'ятати слова, а
                не просто один раз переглянути.
            </p>
            <p class="mt-4 text-body text-cream-dim">
                Mnemio вирішує саме цю проблему: замість статичного файлу ви отримуєте інтерактивну
                колоду карток із розкладом повторень, який сам нагадує, коли й що повторити.
            </p>
        </section>

        <section class="mx-auto max-w-[1080px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">Як це працює</p>
            <h2 class="mt-2 font-display text-h1 text-cream">Від списку слів до готової колоди</h2>
            <ol class="mt-10 grid gap-5 sm:grid-cols-3">
                <li
                    v-for="(step, i) in steps"
                    :key="step.title"
                    class="rounded-[20px] border border-line bg-bg-surface p-6"
                >
                    <span
                        class="grid size-9 place-items-center rounded-full bg-brand/30 font-display text-h3 text-lavender"
                        >{{ i + 1 }}</span
                    >
                    <h3 class="mt-4 font-display text-h3 text-cream">{{ step.title }}</h3>
                    <p class="mt-2 text-small text-cream-dim">{{ step.body }}</p>
                </li>
            </ol>
        </section>

        <section class="mx-auto max-w-[760px] px-6 pb-16">
            <p class="text-eyebrow uppercase text-brand-muted">Запитання</p>
            <h2 class="mt-2 font-display text-h1 text-cream">
                Лексичний мінімум — короткі відповіді
            </h2>
            <div class="mt-8 flex flex-col gap-4">
                <div
                    v-for="item in faqs"
                    :key="item.q"
                    class="rounded-[20px] border border-line bg-bg-surface p-6"
                >
                    <h3 class="font-display text-h3 text-cream">{{ item.q }}</h3>
                    <p class="mt-2 text-body text-cream-dim">{{ item.a }}</p>
                </div>
            </div>
        </section>

        <section class="border-t border-line">
            <div class="mx-auto max-w-[1080px] px-6 py-20 text-center">
                <h2 class="font-display text-h1 text-cream">
                    Перетворіть свій список слів на картки за хвилину
                </h2>
                <div class="mt-6 flex justify-center gap-3">
                    <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                        Почати безкоштовно
                    </UiButton>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { useHead, useSiteConfig } from '#imports';

// Ukrainian-Cyrillic keyword page targeting "лексичний мінімум з англійської мови" — the
// official, named term for the required НМТ/ЗНО vocabulary list. Every competing search result
// is a static PDF; this page positions Mnemio's AI import as the interactive alternative.
// Content is hardcoded Ukrainian (not the reactive en/uk catalog), same reasoning as
// kvizlet-alternatyva.vue — this page must stay Ukrainian regardless of visitor/crawler locale.
definePageMeta({ layout: 'marketing' });

const year = new Date().getFullYear();

useSeo({
    title: `Лексичний мінімум НМТ ${year} — інтерактивні картки для вивчення`,
    description:
        'Перетворіть лексичний мінімум з англійської мови на готову колоду карток з інтервальним повторенням. Завантажте PDF чи список слів — Mnemio створить картки автоматично.',
});

const steps = [
    {
        title: 'Завантажте список',
        body: 'Завантажте офіційний PDF лексичного мінімуму або вставте список слів текстом.',
    },
    {
        title: 'AI створює картки',
        body: 'Mnemio автоматично перетворює кожне слово на картку з перекладом і контекстом.',
    },
    {
        title: 'Навчайтеся',
        body: "SRS-планувальник розраховує, коли повторити кожне слово, щоб воно запам'яталося.",
    },
];

const faqs = [
    {
        q: 'Що таке лексичний мінімум з англійської мови?',
        a: "Це офіційний перелік слів і словосполучень, обов'язкових для НМТ/ЗНО з англійської мови — базова лексика, яку перевіряють на іспиті.",
    },
    {
        q: 'Чи можна завантажити готовий PDF лексичного мінімуму в Mnemio?',
        a: 'Так — завантажте PDF, скріншот чи вставте текст списку, і AI Mnemio перетворить слова на картки для вивчення автоматично.',
    },
    {
        q: 'Чим це краще за звичайний PDF-файл?',
        a: "PDF потрібно перечитувати вручну без жодного розкладу повторень. Колода в Mnemio використовує інтервальне повторення, яке саме нагадує, які слова повторити й коли — так лексика запам'ятовується, а не просто одноразово переглядається.",
    },
];

const site = useSiteConfig();
const base = (site.url || 'https://mnemio.xyz').replace(/\/$/, '');
useHead({
    htmlAttrs: { lang: 'uk' },
    meta: [{ property: 'og:locale', content: 'uk_UA' }],
    script: [
        {
            type: 'application/ld+json',
            key: 'ld-leksychnyi-faq',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                url: `${base}/leksychnyi-minimum-nmt`,
                inLanguage: 'uk',
                mainEntity: faqs.map((f) => ({
                    '@type': 'Question',
                    name: f.q,
                    acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
            }),
        },
    ],
});
</script>
