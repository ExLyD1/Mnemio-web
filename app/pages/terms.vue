<template>
    <MarketingLegal
        title="Terms of Service"
        updated="June 2026"
        :summary="summary"
        :sections="sections"
    />
</template>

<script setup lang="ts">
definePageMeta({ layout: 'marketing' });

const summary =
    'By using Mnemio you agree to these terms. We’ve kept them short and readable — the gist is: be reasonable, and we’ll do the same.';

const sections = [
    {
        heading: 'Using Mnemio',
        body: 'You may use Mnemio for personal or educational study. You’re responsible for the content you add and for keeping your account secure.',
    },
    {
        heading: 'Your content',
        body: 'You keep ownership of every deck and card you create. You grant us only the permissions needed to store and display them back to you.',
    },
    {
        heading: 'Acceptable use',
        body: 'Don’t upload unlawful content, attempt to break the service, or abuse other users. We may suspend accounts that do.',
    },
    {
        heading: 'Availability',
        body: 'We aim for high uptime but the service is provided “as is”. Features may change as Mnemio evolves.',
    },
    {
        heading: 'Termination',
        body: 'You can stop using Mnemio and delete your account at any time. We may end access if these terms are seriously breached.',
    },
    {
        heading: 'Contact',
        body: 'Questions about these terms? Reach us any time and we’ll get back to you.',
    },
];
</script>
