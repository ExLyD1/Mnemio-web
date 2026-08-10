import { ref } from 'vue';
import * as achievementsApi from '@/api/achievements';
import { useToast } from '@/composables/useToast';
import { useT } from '@/composables/useT';
import type { Achievement } from '@/types/achievement';

// Module-level singleton state, shared across every call — same pattern as
// useToast.ts. Backs the notification-bell dropdown/badge (Topbar.vue).
const unseen = ref<Achievement[]>([]);

// Guards against toasting the same unlock twice within one page load (e.g. a
// rate() response and a boot-time fetchUnseen() racing on the same key).
// This is NOT what stops repeat toasts across visits/reloads — that's the
// server-side `notifiedAt` flag; GET /achievements/unseen simply won't
// return an already-acked achievement again.
const toastedThisSession = new Set<string>();

const upsertUnseen = (items: Achievement[]) => {
    if (items.length === 0) {
        return;
    }
    const byKey = new Map(unseen.value.map((a) => [a.key, a]));
    for (const a of items) {
        byKey.set(a.key, a);
    }
    unseen.value = [...byKey.values()];
};

export const useAchievementNotifications = () => {
    const toast = useToast();
    const { t } = useT();

    // Backend ships English name/description; translate by the stable `key`
    // (mirrors profile.vue / statistics.vue), falling back to the server text.
    const achName = (a: Achievement) => t(`achievements.${a.key}.name`, a.name);

    /**
     * Feed newly-unlocked achievements in — whether they arrived inline on a
     * rate/session-complete/card-create response, or via the boot-time
     * `fetchUnseen()` catch-up. Toasts each one once and adds it to `unseen`
     * for the bell.
     */
    const announce = (achievements: Achievement[]) => {
        const fresh = achievements.filter((a) => !toastedThisSession.has(a.key));
        if (fresh.length === 0) {
            return;
        }
        upsertUnseen(fresh);
        for (const a of fresh) {
            toastedThisSession.add(a.key);
            toast.success(t('achievements.unlocked').replace('{name}', achName(a)));
        }
        // The popup must only ever fire once. Ack server-side right away so
        // the next GET /achievements/unseen (next reload/boot/tab) doesn't
        // hand these back and re-toast them. The bell (`unseen`) keeps
        // showing them for this session regardless — `ack()` below (called
        // when the user actually opens/clicks a bell item) is what clears
        // them from the bell itself.
        achievementsApi.ackAchievements(fresh.map((a) => a.key)).catch(() => {
            // best-effort — a failed ack just risks one repeat toast next boot
        });
    };

    /** Marks achievements as seen. Omit `keys` to ack everything unseen. */
    const ack = async (keys?: string[]): Promise<void> => {
        const targets = keys ?? unseen.value.map((a) => a.key);
        if (targets.length === 0) {
            return;
        }
        try {
            await achievementsApi.ackAchievements(keys);
            const targetSet = new Set(targets);
            unseen.value = unseen.value.filter((a) => !targetSet.has(a.key));
        } catch {
            // Leave it in `unseen` — the bell just retries next time it's opened.
        }
    };

    /**
     * Boot-time catch-up: surfaces (and toasts) anything unlocked since this
     * device last acked — e.g. earned in another tab/device. Call once on app
     * boot; the three trigger responses cover the instant, same-tab case.
     */
    const fetchUnseen = async (): Promise<void> => {
        try {
            const { items } = await achievementsApi.getUnseenAchievements();
            announce(items);
        } catch {
            // non-critical — the bell just stays empty until the next successful fetch
        }
    };

    return { unseen, announce, ack, fetchUnseen };
};
