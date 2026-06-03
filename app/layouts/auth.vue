<template>
    <div class="relative min-h-screen bg-bg-base bg-page-glow text-cream">
        <NuxtLink
            to="/"
            class="absolute right-6 top-6 text-small text-brand-muted transition-colors hover:text-cream"
        >
            Exit
        </NuxtLink>
        <div class="flex min-h-screen items-center justify-center px-4 py-16">
            <slot />
        </div>
    </div>
</template>
