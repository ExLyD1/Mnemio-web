<template>
    <NuxtLoadingIndicator color="rgb(var(--c-purple))" :height="3" />
    <NuxtLayout>
        <NuxtPage :key="$i18n.locale" />
    </NuxtLayout>
    <UiToastContainer />
</template>
