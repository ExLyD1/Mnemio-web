<template>
    <svg width="0" height="0" style="position: absolute" aria-hidden="true">
        <filter
            id="mimiRim"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
            color-interpolation-filters="sRGB"
        >
            <feMorphology in="SourceAlpha" operator="dilate" radius="1.6" result="d" />
            <feGaussianBlur in="d" stdDeviation=".35" result="b" />
            <feFlood style="flood-color: rgb(var(--c-cream))" result="c" />
            <feComposite in="c" in2="b" operator="in" result="r" />
            <feMerge>
                <feMergeNode in="r" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    </svg>
    <NuxtLoadingIndicator color="rgb(var(--c-purple))" :height="3" />
    <NuxtLayout>
        <NuxtPage :key="$i18n.locale" />
    </NuxtLayout>
    <UiToastContainer />
</template>
