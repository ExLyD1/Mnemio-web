<template>
    <div class="mx-auto max-w-2xl px-6 py-16">
        <NuxtLink
            to="/login"
            class="mb-8 inline-flex items-center gap-2 text-small text-brand-muted hover:text-cream"
        >
            <ChevronLeft class="size-4" /> Back to login
        </NuxtLink>
        <h1 class="font-display text-h1 text-cream">Terms &amp; Conditions</h1>
        <p class="mt-2 text-small text-brand-muted">Last updated: June 2025</p>
        <div class="mt-10 flex flex-col gap-8 text-body text-cream-dim">
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">1. Acceptance</h2>
                <p>
                    By creating an account and using Mnemio, you agree to these Terms. If you do not
                    agree, please do not use the service.
                </p>
            </section>
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">2. Use of the service</h2>
                <p>
                    Mnemio is provided for personal, non-commercial study purposes. You may not use
                    the service to distribute harmful content or attempt to circumvent security
                    measures.
                </p>
            </section>
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">3. Your content</h2>
                <p>
                    You retain ownership of the flashcard content you create. By using Mnemio, you
                    grant us a limited licence to store and display that content to you within the
                    app.
                </p>
            </section>
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">4. Availability</h2>
                <p>
                    We aim for high availability but cannot guarantee uninterrupted access. The
                    service may change or be discontinued with reasonable notice.
                </p>
            </section>
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">5. Contact</h2>
                <p>
                    Questions about these Terms? Reach us at
                    <a href="mailto:hello@mnemio.app" class="text-accent hover:underline"
                        >hello@mnemio.app</a
                    >.
                </p>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next';

definePageMeta({ layout: 'auth' });
</script>
