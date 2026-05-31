<template>
    <footer class="border-t border-line bg-bg-landing py-20">
        <div class="mx-auto max-w-[1240px] px-8">
            <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <NuxtLink to="/" class="flex items-center gap-2.5">
                        <span
                            class="grid size-7 place-items-center rounded-lg bg-plum-card-back text-pink-soft"
                        >
                            <Sparkles class="size-3.5" />
                        </span>
                        <span class="font-display text-[22px] tracking-tight text-cream">
                            Mnemio
                        </span>
                    </NuxtLink>
                    <p class="mt-3.5 max-w-[36ch] text-small text-cream-dim">
                        A study companion for people who'd rather learn once than cram every week.
                    </p>
                </div>

                <div v-for="col in columns" :key="col.title">
                    <h5 class="mb-3 text-eyebrow uppercase text-cream-faint">{{ col.title }}</h5>
                    <ul class="space-y-2">
                        <li v-for="link in col.links" :key="link">
                            <a
                                href="#"
                                class="text-small text-cream-dim transition-colors hover:text-cream"
                            >
                                {{ link }}
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div
                class="mt-14 flex flex-col items-start justify-between gap-3 border-t border-line pt-6 text-small text-cream-faint sm:flex-row sm:items-center"
            >
                <div>© {{ year }} Mnemio Labs. All cards, eventually remembered.</div>
                <div>
                    Built with care · status:
                    <span class="text-success">● operational</span>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next';

const year = new Date().getFullYear();

const columns = [
    { title: 'Product', links: ['Features', 'AI companion', 'Pricing', 'Changelog'] },
    { title: 'Learn', links: ['Memory science', 'Best practices', 'Community decks', 'Blog'] },
    { title: 'Company', links: ['About', 'Contact', 'Privacy', 'Terms'] },
];
</script>
