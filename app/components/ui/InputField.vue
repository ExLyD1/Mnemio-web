<template>
    <div
        class="rounded-xl border border-brand-muted bg-transparent px-4 pb-3 pt-2 focus-within:border-brand-pale transition-colors"
    >
        <span class="mb-0.5 block text-[11px] leading-none text-brand-muted">{{ label }}</span>
        <div class="flex items-center gap-2">
            <input
                :value="modelValue"
                :type="inputType"
                :placeholder="placeholder"
                class="flex-1 bg-transparent text-body text-brand-pale outline-none placeholder:text-brand-muted/50"
                v-bind="$attrs"
                @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            />
            <div class="flex shrink-0 items-center gap-1">
                <slot name="suffix" />
                <button
                    v-if="type === 'password'"
                    type="button"
                    @click="showPassword = !showPassword"
                >
                    <Eye
                        v-if="!showPassword"
                        class="size-4 text-brand-muted transition-colors hover:text-brand-pale"
                    />
                    <EyeOff
                        v-else
                        class="size-4 text-brand-muted transition-colors hover:text-brand-pale"
                    />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
    defineProps<{
        modelValue: string;
        label: string;
        type?: string;
        placeholder?: string;
    }>(),
    { type: 'text', placeholder: '' },
);

defineEmits<{ 'update:modelValue': [value: string] }>();

const showPassword = ref(false);
const inputType = computed(() =>
    props.type === 'password' && showPassword.value ? 'text' : props.type,
);
</script>
