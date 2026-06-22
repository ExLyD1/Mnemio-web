<template>
    <div class="mx-auto max-w-2xl px-6 py-16">
        <NuxtLink
            to="/login"
            class="mb-8 inline-flex items-center gap-2 text-small text-brand-muted hover:text-cream"
        >
            <ChevronLeft class="size-4" /> {{ t('privacy.backToLogin') }}
        </NuxtLink>
        <h1 class="font-display text-h1 text-cream">{{ t('privacy.title') }}</h1>
        <p class="mt-2 text-small text-brand-muted">{{ t('privacy.updated') }}</p>
        <div class="mt-10 flex flex-col gap-8 text-body text-cream-dim">
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">{{ t('privacy.s1Title') }}</h2>
                <p>{{ t('privacy.s1Body') }}</p>
            </section>
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">{{ t('privacy.s2Title') }}</h2>
                <p>{{ t('privacy.s2Body') }}</p>
            </section>
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">{{ t('privacy.s3Title') }}</h2>
                <p>{{ t('privacy.s3Body') }}</p>
            </section>
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">{{ t('privacy.s4Title') }}</h2>
                <p>{{ t('privacy.s4Body') }}</p>
            </section>
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">{{ t('privacy.s5Title') }}</h2>
                <p>
                    {{ t('privacy.s5Body') }}
                    <a href="mailto:privacy@mnemio.app" class="text-accent hover:underline"
                        >privacy@mnemio.app</a
                    >.
                </p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next';
import { useT } from '#imports';

definePageMeta({ layout: 'auth' });

const { t } = useT();

useSeo({ title: t('seo.privacyTitle'), description: t('seo.privacyDesc') });
</script>
