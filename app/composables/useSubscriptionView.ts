import { subscriptionState, daysUntil, ended } from '@/utils/subscriptionState';
import { formatMoney, formatDate, formatCard } from '@/utils/format';

export const useSubscriptionView = () => {
    const billing = useBilling();
    const store = billing.billingStore;
    const { t } = useT();
    const { current } = useAppLocale();
    const now = ref(Date.now());
    let timer: ReturnType<typeof setInterval> | undefined;
    onMounted(() => {
        timer = setInterval(() => {
            now.value = Date.now();
        }, 60000);
    });
    onScopeDispose(() => clearInterval(timer));
    const sub = computed(() => store.subscription);
    const state = computed(() => subscriptionState(sub.value, now.value));
    const premium = computed(() =>
        ['active', 'trialing', 'trial_ending', 'cancelled', 'past_due', 'pause_scheduled'].includes(
            state.value,
        ),
    );
    const money = (value: Parameters<typeof formatMoney>[0]) => formatMoney(value, current.value);
    const date = (value: string | null | undefined) => formatDate(value, current.value);
    const text = (key: string, values: Record<string, string | number> = {}) =>
        Object.entries(values).reduce(
            (copy, [k, v]) => copy.replaceAll(`{${k}}`, String(v)),
            t(key),
        );
    const boundary = computed(() =>
        sub.value?.status === 'trialing'
            ? (sub.value.trialEnd ?? sub.value.currentPeriodEnd)
            : sub.value?.currentPeriodEnd,
    );
    const price = computed(() => money(sub.value?.price));
    const plan = computed(() => t(`billing.settings.plan.${sub.value?.plan ?? 'monthly'}`));
    const card = computed(() => formatCard(sub.value?.paymentMethod) || '—');
    const stateLabel = computed(() => t(`billing.subscription.states.${state.value}`));
    const subline = computed(() => {
        const s = sub.value;
        if (!s) {
            return '';
        }
        if (ended(s)) {
            return t('billing.subscription.ended');
        }
        if (state.value === 'past_due') {
            return text('billing.subscription.updateBy', { date: date(s.pastDue?.graceEndsAt) });
        }
        if (state.value === 'paused' || state.value === 'pause_scheduled') {
            return text('billing.subscription.pausedFrom', {
                date: date(
                    s.scheduledChange?.action === 'pause'
                        ? s.scheduledChange.effectiveAt
                        : s.currentPeriodEnd,
                ),
            });
        }
        return text(
            state.value === 'cancelled'
                ? 'billing.subscription.ends'
                : s.status === 'trialing'
                  ? 'billing.subscription.trialEnds'
                  : 'billing.subscription.renews',
            { date: date(boundary.value) },
        );
    });
    const used = computed(() => store.usage?.kinds.chat.used);
    const cap = computed(() => store.usage?.kinds.chat.cap);
    const freeCap = computed(() => store.usage?.freeCaps?.chat);
    const resumeAt = computed(
        () =>
            sub.value?.scheduledChange?.resumeAt ??
            (sub.value?.scheduledChange?.action === 'resume'
                ? sub.value.scheduledChange.effectiveAt
                : null),
    );
    const pauseMonths = computed(() => {
        const change = sub.value?.scheduledChange;
        if (!change?.resumeAt) {
            return null;
        }
        const start = new Date(change.effectiveAt);
        const end = new Date(change.resumeAt);
        if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
            return null;
        }
        return Math.max(
            1,
            (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
                end.getUTCMonth() -
                start.getUTCMonth(),
        );
    });
    const days = computed(() => daysUntil(boundary.value, now.value));
    return {
        billing,
        store,
        sub,
        state,
        premium,
        money,
        date,
        text,
        boundary,
        price,
        plan,
        card,
        stateLabel,
        subline,
        used,
        cap,
        freeCap,
        days,
        now,
        resumeAt,
        pauseMonths,
    };
};
