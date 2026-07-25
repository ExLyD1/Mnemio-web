<template>
    <section class="flex h-full">
        <!-- Sidebar: static on md+, drawer on mobile -->
        <div class="hidden w-64 shrink-0 border-r border-line p-3 md:block">
            <AiChatSidebar
                :conversations="chat.conversations.value"
                :active-id="chat.activeId.value"
                :loading="chat.loadingList.value"
                @new="onNew"
                @select="onSelect"
                @rename="chat.rename"
                @delete="chat.remove"
            />
        </div>

        <Transition name="chat-drawer">
            <div v-if="sidebarOpen" class="fixed inset-0 z-40 md:hidden">
                <div
                    class="chat-drawer-backdrop absolute inset-0 bg-black/50"
                    @click="sidebarOpen = false"
                />
                <div
                    class="chat-drawer-panel absolute inset-y-0 left-0 w-72 max-w-[82%] border-r border-line bg-bg-base p-3"
                >
                    <AiChatSidebar
                        :conversations="chat.conversations.value"
                        :active-id="chat.activeId.value"
                        :loading="chat.loadingList.value"
                        @new="onNew"
                        @select="onSelect"
                        @rename="chat.rename"
                        @delete="chat.remove"
                    />
                </div>
            </div>
        </Transition>

        <!-- Main column -->
        <div class="flex min-w-0 flex-1 flex-col">
            <header class="flex items-center gap-2 border-b border-line px-4 py-3">
                <button
                    type="button"
                    class="rounded-md p-1.5 text-brand-muted hover:bg-bg-muted hover:text-cream md:hidden"
                    :aria-label="t('chat.menu')"
                    @click="sidebarOpen = true"
                >
                    <Menu class="size-5" />
                </button>
                <p class="min-w-0 flex-1 truncate font-display text-h3 text-cream">
                    {{ activeTitle || t('aiPage.title') }}
                </p>
            </header>

            <!-- Thread -->
            <div ref="threadEl" class="flex-1 overflow-y-auto px-4 py-6">
                <div class="mx-auto flex max-w-3xl flex-col gap-4">
                    <!-- Empty / greeting -->
                    <div
                        v-if="!chat.messages.value.length && !chat.loadingThread.value"
                        class="flex flex-col items-center gap-4 py-12 text-center"
                    >
                        <SharedMimi :size="80" />
                        <h2 class="font-display text-h2 text-cream">{{ t('chat.emptyTitle') }}</h2>
                        <p class="max-w-[42ch] text-body text-cream-dim">
                            {{ t('chat.emptyHint') }}
                        </p>
                        <!-- Quick-action pills -->
                        <div class="mt-2 flex flex-wrap justify-center gap-2">
                            <button
                                v-for="q in quickActions"
                                :key="q"
                                type="button"
                                class="rounded-full border border-line bg-bg-surface px-4 py-2 text-small text-cream-dim transition-colors hover:border-brand-bright/50 hover:text-cream"
                                @click="sendQuick(q)"
                            >
                                {{ q }}
                            </button>
                        </div>
                    </div>

                    <div v-if="chat.loadingThread.value" class="flex justify-center py-8">
                        <UiSpinner />
                    </div>

                    <div
                        v-for="(m, i) in chat.messages.value"
                        :key="m.id"
                        class="flex gap-3"
                        :class="m.role === 'user' ? 'flex-row-reverse' : ''"
                    >
                        <SharedMimi v-if="m.role === 'assistant'" :size="36" class="shrink-0" />

                        <div
                            class="flex min-w-0 flex-col gap-1"
                            :class="m.role === 'user' ? 'items-end' : 'items-start'"
                        >
                            <!-- Typing dots: streaming assistant with no text yet -->
                            <div
                                v-if="isStreaming(i) && !m.content"
                                class="flex items-center gap-1.5 rounded-2xl border border-line bg-bg-surface px-4 py-3"
                            >
                                <span
                                    class="size-1.5 animate-typing-dot rounded-full bg-brand-pale"
                                />
                                <span
                                    class="size-1.5 animate-typing-dot rounded-full bg-brand-pale [animation-delay:0.2s]"
                                />
                                <span
                                    class="size-1.5 animate-typing-dot rounded-full bg-brand-pale [animation-delay:0.4s]"
                                />
                            </div>

                            <div
                                v-else-if="m.content"
                                class="max-w-[80%] break-words rounded-2xl px-4 py-2.5 text-body"
                                :class="
                                    m.role === 'user'
                                        ? 'whitespace-pre-wrap bg-brand/90 text-on-color shadow-sm'
                                        : 'border border-line bg-bg-surface text-cream'
                                "
                            >
                                <template v-if="m.role === 'user'">{{ m.content }}</template>
                                <span
                                    v-else
                                    class="chat-prose"
                                    v-html="renderMarkdown(m.content)"
                                />
                                <span
                                    v-if="isStreaming(i)"
                                    class="ml-0.5 inline-block w-1.5 animate-pulse"
                                    >▍</span
                                >
                            </div>

                            <!-- Deck attachments -->
                            <AiDeckCard
                                v-for="(a, ai) in m.attachments ?? []"
                                :key="ai"
                                :deck-id="a.deckId"
                                :title="a.title"
                                :card-count="a.cardCount"
                                class="w-full max-w-[80%]"
                            />

                            <!-- Partial + retry -->
                            <div
                                v-if="m.status === 'partial' && m.role === 'assistant'"
                                class="flex items-center gap-2 text-small text-brand-muted"
                            >
                                <span>{{ t('chat.partial') }}</span>
                                <button
                                    type="button"
                                    class="font-semibold text-brand-pale hover:text-cream"
                                    :disabled="chat.streaming.value"
                                    @click="chat.retry"
                                >
                                    {{ t('chat.retry') }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Composer -->
            <div class="border-t border-line px-4 py-3">
                <div class="mx-auto max-w-3xl">
                    <!-- Attached image preview + mode toggle -->
                    <div v-if="attachedImage" class="mb-2 flex items-center gap-3">
                        <div class="relative">
                            <img
                                :src="attachedPreview!"
                                :alt="t('image.previewAlt')"
                                class="size-12 rounded-lg border border-line object-cover"
                            />
                            <button
                                type="button"
                                class="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-bg-surface-2 text-brand-muted transition-colors hover:text-cream"
                                :aria-label="t('image.remove')"
                                @click="clearAttachment"
                            >
                                <X class="size-3" />
                            </button>
                        </div>
                        <!-- Direct-create vs editable-preview toggle (editable coming soon → disabled) -->
                        <div
                            class="flex items-center gap-1 rounded-full border border-line p-0.5 opacity-60"
                            :title="t('image.previewSoon')"
                        >
                            <span class="rounded-full bg-brand px-3 py-1 text-small text-on-color">
                                {{ t('image.modeDirect') }}
                            </span>
                            <button
                                type="button"
                                disabled
                                class="cursor-not-allowed rounded-full px-3 py-1 text-small text-brand-muted"
                            >
                                {{ t('image.modePreview') }}
                            </button>
                        </div>
                    </div>

                    <div
                        class="flex items-end gap-2 rounded-2xl border border-line-strong bg-bg-surface p-2 focus-within:border-brand-bright"
                    >
                        <input
                            ref="imageInput"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            class="hidden"
                            @change="onPickImage"
                        />
                        <UiButton
                            variant="ghost"
                            class="shrink-0"
                            :disabled="chat.streaming.value"
                            :aria-label="t('image.attach')"
                            @click="imageInput?.click()"
                        >
                            <ImagePlus class="size-4" />
                        </UiButton>
                        <textarea
                            ref="inputEl"
                            v-model="draft"
                            rows="1"
                            :placeholder="t('chat.placeholder')"
                            class="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-body text-cream outline-none placeholder:text-brand-muted"
                            @input="autoGrow"
                            @keydown.enter="onEnterKey"
                            @paste="onPasteImage"
                        />
                        <UiButton
                            variant="primary"
                            class="shrink-0"
                            :disabled="(!draft.trim() && !attachedImage) || chat.streaming.value"
                            :aria-label="t('chat.send')"
                            @click="onSend"
                        >
                            <UiSpinner v-if="chat.streaming.value" size="sm" />
                            <Send v-else class="size-4" />
                        </UiButton>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { Send, Menu, ImagePlus, X } from 'lucide-vue-next';
import { useChat, useToast, useT } from '#imports';
import { useAuthStore } from '@/stores/auth';
import { usePremiumGateStore } from '@/stores/premiumGate';
import { renderMarkdown } from '@/utils/markdown';

definePageMeta({ layout: 'default' });

const chat = useChat();
const toast = useToast();
const { t } = useT();
const auth = useAuthStore();
const premiumGate = usePremiumGateStore();

useSeo({ title: t('seo.aiTitle'), description: t('seo.appDesc'), noindex: true });

const draft = ref('');
const sidebarOpen = ref(false);
const threadEl = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLTextAreaElement | null>(null);
const imageInput = ref<HTMLInputElement | null>(null);
const attachedImage = ref<File | null>(null);
const attachedPreview = ref<string | null>(null);

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const clearAttachment = () => {
    if (attachedPreview.value) {
        URL.revokeObjectURL(attachedPreview.value);
    }
    attachedPreview.value = null;
    attachedImage.value = null;
};

const stageImage = (f: File | null | undefined) => {
    if (!f) {
        return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        toast.error(t('image.errUnsupportedType'));
        return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
        toast.error(t('image.errTooLarge'));
        return;
    }
    clearAttachment();
    attachedImage.value = f;
    attachedPreview.value = URL.createObjectURL(f);
};

const onPickImage = (e: Event) => {
    const input = e.target as HTMLInputElement;
    stageImage(input.files?.[0]);
    input.value = '';
};

const onPasteImage = (e: ClipboardEvent) => {
    const f = e.clipboardData?.files?.[0];
    if (f && f.type.startsWith('image/')) {
        e.preventDefault();
        stageImage(f);
    }
};

const activeTitle = computed(
    () => chat.conversations.value.find((c) => c.id === chat.activeId.value)?.title ?? '',
);

const quickActions = computed(() => [
    t('chat.quickDeck'),
    t('chat.quickVocab'),
    t('chat.quickTips'),
    t('chat.quickExplain'),
]);

const sendQuick = async (text: string) => {
    draft.value = text;
    await onSend();
};

// Streaming cursor only on the last assistant message while a reply is in flight.
const isStreaming = (i: number) =>
    chat.streaming.value &&
    i === chat.messages.value.length - 1 &&
    chat.messages.value[i]?.role === 'assistant';

const scrollToBottom = () => {
    nextTick(() => {
        const el = threadEl.value;
        if (el) {
            el.scrollTop = el.scrollHeight;
        }
    });
};

const autoGrow = () => {
    const el = inputEl.value;
    if (!el) {
        return;
    }
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
};

const resetInput = () => {
    draft.value = '';
    nextTick(() => {
        if (inputEl.value) {
            inputEl.value.style.height = 'auto';
        }
        inputEl.value?.focus();
    });
};

const onEnterKey = (e: KeyboardEvent) => {
    if (e.shiftKey) return;
    e.preventDefault();
    onSend();
};

const onSend = async () => {
    const text = draft.value.trim();
    const image = attachedImage.value;
    if ((!text && !image) || chat.streaming.value) {
        return;
    }
    resetInput();
    // Detach immediately — send() holds its own reference for retry.
    attachedImage.value = null;
    if (attachedPreview.value) {
        URL.revokeObjectURL(attachedPreview.value);
        attachedPreview.value = null;
    }
    await chat.send(text, image);
};

const onSelect = (id: string) => {
    sidebarOpen.value = false;
    chat.openConversation(id);
};

const onNew = () => {
    sidebarOpen.value = false;
    chat.newConversation();
    nextTick(() => inputEl.value?.focus());
};

const errText = (code: string) => t(`chat.err.${code}`, t('chat.err.generic'));

watch(
    () => chat.streamError.value,
    (e) => {
        if (!e) return;
        if (e.code === 'AI_BUDGET_EXCEEDED' && !auth.isPremium) {
            const cap = (e as { capPerDay?: number }).capPerDay;
            premiumGate.show('ai_budget', cap !== undefined ? { capPerDay: cap } : undefined);
        } else {
            toast.error(errText(e.code));
        }
    },
);

watch(chat.messages, scrollToBottom, { deep: true, flush: 'post' });
watch(chat.loadingThread, (l) => {
    if (!l) {
        scrollToBottom();
    }
});

onMounted(async () => {
    await chat.loadConversations();
    if (chat.conversations.value.length && window.matchMedia('(min-width: 768px)').matches) {
        await chat.openConversation(chat.conversations.value[0]!.id);
    }
});
</script>

<style scoped>
/* Markdown rendered from assistant replies (v-html). Kept minimal and inline-ish
   so a chat bubble reads naturally without a heavy prose framework. */
.chat-prose :deep(p) {
    margin: 0;
}
.chat-prose :deep(p + p) {
    margin-top: 0.5rem;
}
.chat-prose :deep(strong) {
    font-weight: 700;
}
.chat-prose :deep(em) {
    font-style: italic;
}
.chat-prose :deep(ul),
.chat-prose :deep(ol) {
    margin: 0.4rem 0;
    padding-left: 1.2rem;
}
.chat-prose :deep(ul) {
    list-style: disc;
}
.chat-prose :deep(ol) {
    list-style: decimal;
}
.chat-prose :deep(li) {
    margin: 0.15rem 0;
}
.chat-prose :deep(a) {
    color: rgb(var(--c-brand-pale));
    text-decoration: underline;
}
.chat-prose :deep(code) {
    border-radius: 0.3rem;
    background: rgb(var(--c-bg-well));
    padding: 0.1rem 0.35rem;
    font-size: 0.9em;
}
/* Mobile chat sidebar drawer: panel slides from left, backdrop fades */
.chat-drawer-enter-active .chat-drawer-panel,
.chat-drawer-leave-active .chat-drawer-panel {
    transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.chat-drawer-enter-from .chat-drawer-panel,
.chat-drawer-leave-to .chat-drawer-panel {
    transform: translateX(-100%);
}
.chat-drawer-enter-active .chat-drawer-backdrop,
.chat-drawer-leave-active .chat-drawer-backdrop {
    transition: opacity 0.3s ease;
}
.chat-drawer-enter-from .chat-drawer-backdrop,
.chat-drawer-leave-to .chat-drawer-backdrop {
    opacity: 0;
}
.chat-prose :deep(pre) {
    overflow-x: auto;
    border-radius: 0.6rem;
    background: rgb(var(--c-bg-well));
    padding: 0.6rem 0.8rem;
}
.chat-prose :deep(pre code) {
    background: transparent;
    padding: 0;
}
.chat-prose :deep(h1),
.chat-prose :deep(h2),
.chat-prose :deep(h3) {
    margin: 0.4rem 0 0.2rem;
    font-weight: 700;
}
</style>
