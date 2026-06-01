<template>
    <div class="flex h-screen overflow-hidden bg-bg-base bg-page-glow text-cream">
        <AppRail />
        <div class="flex flex-1 flex-col overflow-hidden">
            <AppTopbar />
            <main class="flex-1 overflow-y-auto">
                <slot />
            </main>
        </div>
    </div>
</template>
