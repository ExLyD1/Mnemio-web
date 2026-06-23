<template>
    <NuxtLoadingIndicator color="#A98EE3" :height="3" />
    <NuxtLayout>
        <NuxtPage :key="$i18n.locale" />
    </NuxtLayout>
    <UiToastContainer />
</template>
