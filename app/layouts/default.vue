<template>
    <div class="flex h-screen overflow-hidden bg-bg-base bg-page-glow text-cream">
        <AppRail class="hidden md:flex" />
        <div class="flex flex-1 flex-col overflow-hidden">
            <AppTopbar />
            <main class="flex-1 overflow-y-auto pb-16 md:pb-0">
                <slot />
            </main>
        </div>
        <AppBottomTabBar />
    </div>
</template>
