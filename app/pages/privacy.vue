<template>
    <div class="mx-auto max-w-2xl px-6 py-16">
        <NuxtLink
            to="/login"
            class="mb-8 inline-flex items-center gap-2 text-small text-brand-muted hover:text-cream"
        >
            <ChevronLeft class="size-4" /> Back to login
        </NuxtLink>
        <h1 class="font-display text-h1 text-cream">Privacy Policy</h1>
        <p class="mt-2 text-small text-brand-muted">Last updated: June 2025</p>
        <div class="mt-10 flex flex-col gap-8 text-body text-cream-dim">
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">1. Information we collect</h2>
                <p>
                    We collect the email address and password you provide when creating an account,
                    along with usage data such as the decks you study and your session history. We
                    do not sell your personal data to third parties.
                </p>
            </section>
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">2. How we use it</h2>
                <p>
                    Your data is used solely to operate the service — to authenticate you, sync your
                    study progress, and improve the app experience.
                </p>
            </section>
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">3. Data retention</h2>
                <p>
                    You can delete your account at any time from the Profile page. Upon deletion,
                    all associated data is permanently removed within 30 days.
                </p>
            </section>
            <section>
                <h2 class="mb-3 font-display text-h3 text-cream">4. Contact</h2>
                <p>
                    For privacy-related questions contact us at
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

definePageMeta({ layout: 'auth' });
</script>
