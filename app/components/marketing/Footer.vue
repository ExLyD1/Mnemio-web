<template>
    <footer class="border-t border-line bg-bg-surface py-16">
        <div class="mx-auto max-w-[1080px] px-6">
            <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <SharedBrandMark />
                    <p class="mt-3 max-w-[34ch] text-small text-cream-dim">
                        The calm, AI-powered way to learn vocabulary that actually sticks.
                    </p>
                </div>
                <div v-for="col in columns" :key="col.title">
                    <h5 class="mb-3 text-eyebrow uppercase text-cream-faint">{{ col.title }}</h5>
                    <ul class="space-y-2">
                        <li v-for="l in col.links" :key="l.label">
                            <NuxtLink
                                :to="l.to"
                                class="text-small text-cream-dim transition-colors hover:text-cream"
                            >
                                {{ l.label }}
                            </NuxtLink>
                        </li>
                    </ul>
                </div>
            </div>

            <div
                class="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-small text-cream-faint sm:flex-row sm:items-center sm:justify-between"
            >
                <span>© {{ year }} Mnemio. All rights reserved.</span>
                <div class="flex gap-3">
                    <a
                        v-for="s in socials"
                        :key="s.label"
                        :href="s.href"
                        target="_blank"
                        rel="noopener"
                        :aria-label="s.label"
                        class="grid size-9 place-items-center rounded-full border border-line-strong text-brand-muted transition-colors hover:text-cream"
                    >
                        <component :is="s.icon" class="size-4" />
                    </a>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { Twitter, Github, Instagram } from 'lucide-vue-next';

const year = new Date().getFullYear();

const columns = [
    {
        title: 'Product',
        links: [
            { label: 'Features', to: '/#features' },
            { label: 'Try a card', to: '/#demo' },
            { label: 'Decks', to: '/discover' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About', to: '/about' },
            { label: 'Blog', to: '/blog' },
            { label: 'Contact', to: '/about' },
        ],
    },
    {
        title: 'Resources',
        links: [
            { label: 'Privacy', to: '/privacy' },
            { label: 'Terms', to: '/terms' },
            { label: 'Help center', to: '/about' },
        ],
    },
];

const socials = [
    { label: 'Twitter', href: 'https://twitter.com/mnemio', icon: Twitter },
    { label: 'GitHub', href: 'https://github.com/mnemio', icon: Github },
    { label: 'Instagram', href: 'https://instagram.com/mnemio', icon: Instagram },
];
</script>
