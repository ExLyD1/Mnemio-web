<template>
    <aside class="flex h-full min-h-0 flex-col gap-3">
        <UiButton variant="primary" class="w-full justify-center" @click="$emit('new')">
            <Plus class="size-4" /> {{ t('chat.newChat') }}
        </UiButton>

        <div class="min-h-0 flex-1 overflow-y-auto pr-0.5">
            <div v-if="loading && !conversations.length" class="flex justify-center py-6">
                <UiSpinner size="sm" />
            </div>

            <p v-else-if="!conversations.length" class="px-2 py-4 text-small text-brand-muted">
                {{ t('chat.noChats') }}
            </p>

            <ul v-else class="flex flex-col gap-0.5">
                <li v-for="c in conversations" :key="c.id">
                    <div
                        class="group flex items-center gap-1 rounded-xl px-1 transition-colors"
                        :class="c.id === activeId ? 'bg-brand/20' : 'hover:bg-bg-muted'"
                    >
                        <template v-if="editingId === c.id">
                            <input
                                ref="editInput"
                                v-model="editTitle"
                                class="min-w-0 flex-1 rounded-lg border border-brand-pale/40 bg-bg-well px-2 py-1.5 text-sm text-cream outline-none focus:border-brand-bright"
                                @keydown.enter="commitRename"
                                @keydown.esc="cancelRename"
                                @blur="commitRename"
                            />
                        </template>
                        <template v-else>
                            <button
                                type="button"
                                class="min-w-0 flex-1 truncate px-2 py-2 text-left text-body"
                                :class="c.id === activeId ? 'text-cream' : 'text-brand-pale'"
                                :title="c.title"
                                @click="$emit('select', c.id)"
                            >
                                {{ c.title }}
                            </button>

                            <UiPopover align="right">
                                <template #trigger="{ toggle }">
                                    <button
                                        type="button"
                                        class="shrink-0 rounded-md p-1.5 text-brand-muted opacity-0 transition-opacity hover:text-cream group-hover:opacity-100"
                                        :class="{ 'opacity-100': c.id === activeId }"
                                        :aria-label="t('chat.menu')"
                                        @click="toggle"
                                    >
                                        <MoreVertical class="size-4" />
                                    </button>
                                </template>
                                <template #default="{ close }">
                                    <button
                                        type="button"
                                        class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-body text-brand-pale transition-colors hover:bg-brand/20"
                                        @click="startRename(c, close)"
                                    >
                                        <Pencil class="size-4" /> {{ t('chat.rename') }}
                                    </button>
                                    <button
                                        type="button"
                                        class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-body text-error transition-colors hover:bg-error/10"
                                        @click="onDelete(c, close)"
                                    >
                                        <Trash2 class="size-4" /> {{ t('chat.delete') }}
                                    </button>
                                </template>
                            </UiPopover>
                        </template>
                    </div>
                </li>
            </ul>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-vue-next';
import { useT } from '@/composables/useT';
import type { Conversation } from '@/api/chat';

const props = defineProps<{
    conversations: Conversation[];
    activeId: string | null;
    loading?: boolean;
}>();

const emit = defineEmits<{
    new: [];
    select: [id: string];
    rename: [id: string, title: string];
    delete: [id: string];
}>();

const { t } = useT();

const editingId = ref<string | null>(null);
const editTitle = ref('');
const editInput = ref<HTMLInputElement[] | HTMLInputElement | null>(null);

const startRename = async (c: Conversation, close: () => void) => {
    close();
    editingId.value = c.id;
    editTitle.value = c.title;
    await nextTick();
    const el = Array.isArray(editInput.value) ? editInput.value[0] : editInput.value;
    el?.focus();
    el?.select();
};

const commitRename = () => {
    if (!editingId.value) {
        return;
    }
    const id = editingId.value;
    const title = editTitle.value.trim();
    const current = props.conversations.find((c) => c.id === id);
    editingId.value = null;
    if (title && current && title !== current.title) {
        emit('rename', id, title);
    }
};

const cancelRename = () => {
    editingId.value = null;
};

const onDelete = (c: Conversation, close: () => void) => {
    close();
    if (window.confirm(t('chat.deleteConfirm'))) {
        emit('delete', c.id);
    }
};
</script>
