<template>
    <section
        v-for="setting in settings"
        :key="setting.key"
        class="rounded-[20px] border border-line bg-bg-surface p-6"
    >
        <div class="mb-3 flex items-baseline justify-between gap-3">
            <p :id="`appearance-${setting.key}`" class="text-eyebrow uppercase text-brand-muted">
                {{ t(`profile.appearance.${setting.key}`) }}
            </p>
            <p :id="`appearance-${setting.key}-hint`" class="text-small text-brand-muted">
                {{ t(`profile.appearance.${setting.key}Hint`) }}
            </p>
        </div>
        <div
            role="radiogroup"
            :aria-labelledby="`appearance-${setting.key}`"
            :aria-describedby="`appearance-${setting.key}-hint`"
            class="grid gap-2.5"
            :class="setting.key === 'mascot' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'"
        >
            <button
                v-for="option in setting.options"
                :key="option"
                type="button"
                role="radio"
                :aria-checked="selected(setting.key) === option"
                :tabindex="selected(setting.key) === option ? 0 : -1"
                class="flex min-h-11 min-w-0 flex-col gap-3 rounded-2xl border p-4 transition-colors focus-visible:shadow-focus-ring focus-visible:outline-none"
                :class="[
                    setting.key === 'mascot' ? 'items-center text-center' : 'text-left',
                    selected(setting.key) === option
                        ? 'border-purple bg-plum/25 shadow-radio-ring'
                        : 'border-line-strong bg-bg-surface-2 hover:bg-cream/5',
                ]"
                @click="select(setting.key, option)"
                @keydown="onKeydown($event, setting.key, option, setting.options)"
            >
                <span
                    v-if="setting.key === 'mascot'"
                    class="grid h-[96px] w-full place-items-center rounded-xl bg-mimi-ambient"
                >
                    <SharedMimi
                        :mascot="asMascot(option)"
                        :pose="option === 'axolotl' ? 'neutral' : 'wave'"
                        :size="80"
                        :bob="false"
                        alt=""
                        class="[&_img]:h-[80px] [&_img]:w-auto [&_img]:object-contain"
                    />
                </span>
                <span
                    v-else
                    class="flex h-[56px] w-full overflow-hidden rounded-xl border border-line"
                >
                    <span
                        v-for="(color, index) in swatches[asPalette(option)]"
                        :key="color"
                        :style="{ background: color }"
                        :class="index === 0 ? 'flex-[2]' : 'flex-1'"
                    />
                </span>
                <span class="flex w-full items-center justify-between gap-2">
                    <span class="break-words text-body font-semibold text-cream">
                        {{
                            t(
                                setting.key === 'mascot'
                                    ? `mascots.${option}.name`
                                    : `palettes.${option}`,
                            )
                        }}
                    </span>
                    <span
                        class="grid size-4 shrink-0 place-items-center rounded-full border"
                        :class="
                            selected(setting.key) === option ? 'border-purple' : 'border-cream-dim'
                        "
                    >
                        <span
                            v-if="selected(setting.key) === option"
                            class="size-2 rounded-full bg-purple"
                        />
                    </span>
                </span>
                <span
                    v-if="setting.key === 'mascot'"
                    class="-mt-2 w-full text-left text-small text-cream-faint"
                >
                    {{ t(`mascots.${option}.note`) }}
                </span>
            </button>
        </div>
    </section>
</template>

<script setup lang="ts">
import { useAppearance } from '@/composables/useAppearance';
import { MASCOTS, PALETTES, isMascot, isPalette } from '@/utils/appearance';
import type { Mascot, Palette } from '@/types/mimi';

const { t } = useT();
const { mascot, palette, setMascot, setPalette } = useAppearance();
type Setting = 'mascot' | 'palette';
const settings = [
    { key: 'mascot', options: MASCOTS },
    { key: 'palette', options: PALETTES },
] as const;
const swatches: Record<Palette, readonly string[]> = {
    green: ['#1E2124', '#33383C', '#7AC98E'],
    violet: ['#201B34', '#5B4B8A', '#A68AF5'],
    pink: ['#281C2B', '#7A3D66', '#FF8FC7'],
};
const asMascot = (value: string): Mascot => (isMascot(value) ? value : 'panda');
const asPalette = (value: string): Palette => (isPalette(value) ? value : 'green');
const selected = (setting: Setting) => (setting === 'mascot' ? mascot.value : palette.value);
const select = (setting: Setting, value: string) => {
    if (setting === 'mascot' && isMascot(value)) void setMascot.execute(value);
    if (setting === 'palette' && isPalette(value)) void setPalette.execute(value);
};
const onKeydown = (
    event: KeyboardEvent,
    setting: Setting,
    value: string,
    options: readonly string[],
) => {
    const direction = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
    if (!direction) return;
    event.preventDefault();
    const index = (options.indexOf(value) + direction + options.length) % options.length;
    const next = options[index];
    const button = (event.currentTarget as HTMLButtonElement).parentElement?.children[index];
    if (next && button instanceof HTMLButtonElement) {
        button.focus();
        select(setting, next);
    }
};
</script>
