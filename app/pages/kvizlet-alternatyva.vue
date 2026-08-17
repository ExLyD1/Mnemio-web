<template>
    <div>
        <section class="mx-auto max-w-[1080px] px-6 py-20 text-center">
            <p class="text-eyebrow uppercase text-brand-muted">Безкоштовна альтернатива Quizlet</p>
            <h1 class="mx-auto mt-2 max-w-[24ch] font-display text-display-sm text-cream">
                Квізлет альтернатива —
                <span class="italic">безкоштовний сервіс для вивчення слів</span>
            </h1>
            <p class="mx-auto mt-4 max-w-[52ch] text-body text-cream-dim">
                Mnemio — безкоштовна альтернатива Quizlet з необмеженою кількістю карток для
                вивчення, інтервальним повторенням і AI, що створює колоду з фото чи статті.
            </p>
            <div class="mt-7 flex flex-wrap justify-center gap-3">
                <UiButton variant="primary" @click="navigateTo('/login?tab=register')">
                    Почати безкоштовно
                </UiButton>
                <UiButton variant="ghost" @click="navigateTo('/discover')">
                    Переглянути публічні колоди
                </UiButton>
            </div>
        </section>

        <section class="mx-auto max-w-[880px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">Чому шукають альтернативу</p>
            <h2 class="mt-2 font-display text-h1 text-cream">
                Поширені причини шукати сервіс на кшталт Quizlet, але безкоштовний
            </h2>
            <ul class="mt-8 flex flex-col gap-4">
                <li
                    class="rounded-[20px] border border-line bg-bg-surface p-5 text-body text-cream-dim"
                >
                    Частина режимів навчання й тестування у Quizlet доступна лише за передплатою
                    Quizlet Plus.
                </li>
                <li
                    class="rounded-[20px] border border-line bg-bg-surface p-5 text-body text-cream-dim"
                >
                    Створення колоди все одно означає вручну набирати кожне слово й переклад.
                </li>
                <li
                    class="rounded-[20px] border border-line bg-bg-surface p-5 text-body text-cream-dim"
                >
                    Немає вбудованого способу перетворити фото сторінки підручника чи статтю на
                    готові картки для вивчення.
                </li>
            </ul>
        </section>

        <section class="mx-auto max-w-[1080px] px-6 py-16">
            <p class="text-eyebrow uppercase text-brand-muted">Що безкоштовно в Mnemio</p>
            <h2 class="mt-2 font-display text-h1 text-cream">Без обмежень на базові функції</h2>
            <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div
                    v-for="f in whatsFree"
                    :key="f.title"
                    class="rounded-[20px] border border-line bg-bg-surface p-6"
                >
                    <h3 class="font-display text-h3 text-cream">{{ f.title }}</h3>
                    <p class="mt-2 text-small text-cream-dim">{{ f.body }}</p>
                </div>
            </div>
        </section>

        <section class="mx-auto max-w-[760px] px-6 pb-16">
            <p class="text-eyebrow uppercase text-brand-muted">Запитання</p>
            <h2 class="mt-2 font-display text-h1 text-cream">
                Альтернатива Quizlet — короткі відповіді
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
    </div>
</template>

<script setup lang="ts">
import { useHead, useSiteConfig } from '#imports';

// Ukrainian-Cyrillic search intent ("квізлет", "квізлет для українців безкоштовно") targets
// searchers who may not even know "Quizlet" is spelled in Latin script. Content is hardcoded
// Ukrainian (not the reactive en/uk catalog) so it stays Ukrainian for a US/EN-locale crawler
// pass too — the whole point of this page is to rank for the Cyrillic query, not to follow
// the visitor's detected locale like the rest of the site.
definePageMeta({ layout: 'marketing' });

useSeo({
    title: 'Квізлет альтернатива — безкоштовні картки для вивчення слів',
    description:
        'Безкоштовна альтернатива Quizlet: необмежена кількість колод, інтервальне повторення та AI, що перетворює фото чи статтю на картки для вивчення автоматично.',
});

const whatsFree = [
    { title: 'Необмежена кількість колод', body: 'Створюйте скільки завгодно колод безкоштовно.' },
    {
        title: 'Повноцінне інтервальне повторення',
        body: 'SRS-планувальник, що вирішує, що й коли повторювати, безкоштовний.',
    },
    {
        title: 'AI-генерація карток',
        body: 'Завантажте фото, PDF чи статтю та отримайте колоду, створену AI.',
    },
    {
        title: 'Публічні колоди',
        body: 'Переглядайте й копіюйте тисячі безкоштовних колод за темами й мовами.',
    },
];

const faqs = [
    {
        q: 'Чи є щось на кшталт Quizlet, але безкоштовне?',
        a: 'Так — основні можливості Mnemio (створення колод, навчання за інтервальним повторенням, перегляд публічних колод) безкоштовні, без обмежень на базові режими навчання.',
    },
    {
        q: 'Як отримати безкоштовний Quizlet?',
        a: 'У Quizlet досі є безкоштовний тариф, але частина режимів обмежена підпискою Plus. Mnemio пропонує повноцінне навчання за інтервальним повторенням безкоштовно, без прихованих обмежень на базові функції.',
    },
    {
        q: 'Чи можна створити картки автоматично, а не вручну?',
        a: 'Так. Завантажте фото, PDF чи статтю в Mnemio, і AI сам знайде незнайомі слова та створить колоду — не потрібно набирати кожну картку вручну.',
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
            key: 'ld-kvizlet-faq',
            innerHTML: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                url: `${base}/kvizlet-alternatyva`,
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
