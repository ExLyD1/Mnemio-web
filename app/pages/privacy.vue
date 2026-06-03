<template>
    <MarketingLegal
        title="Privacy Policy"
        updated="June 2026"
        :summary="summary"
        :sections="sections"
    />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'marketing' });

const summary =
    'We collect the minimum needed to run Mnemio, never sell your data, and give you control over what you share. This page explains the details in plain language.';

const sections = [
    {
        heading: 'What we collect',
        body: 'Your account email, the decks and cards you create, and your study progress. That’s it — no tracking pixels, no ad networks.',
    },
    {
        heading: 'How we use it',
        body: 'To run spaced-repetition scheduling, show your statistics, and keep your account secure. We do not use your content to train third-party models.',
    },
    {
        heading: 'Storage and security',
        body: 'Data is stored encrypted in transit and at rest. Access tokens are short-lived and refresh tokens are kept in HttpOnly cookies.',
    },
    {
        heading: 'Your choices',
        body: 'You can edit or delete any deck or card at any time, export your data, or close your account and have it permanently removed.',
    },
    {
        heading: 'Cookies',
        body: 'We use a single essential cookie to keep you signed in. No analytics or advertising cookies are set.',
    },
    {
        heading: 'Changes',
        body: 'If this policy changes materially we’ll notify you in-app before the change takes effect.',
    },
];
</script>
