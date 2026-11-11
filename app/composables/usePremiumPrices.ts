import { formatMoney } from '@/utils/format';
import { premiumPriceId } from '@/composables/useBilling';

export const usePremiumPrices = () => {
    const { paddle, load, failed } = usePaddle();
    const country = useGeoCountry();
    const preview = usePaddlePrices(paddle, country);
    const { current } = useAppLocale();
    const { t } = useT();
    const amount = (plan: 'monthly' | 'annual') =>
        preview.amounts.value[premiumPriceId(plan) ?? ''];
    const price = (plan: 'monthly' | 'annual') => {
        const id = premiumPriceId(plan) ?? '';
        const base = preview.prices.value[id] ?? '—';
        return preview.plusVat.value[id] ? `${base} ${t('pricing.plusVat')}` : base;
    };
    /** "$9.60 incl. VAT" when the shown price is before VAT, else ''. */
    const inclVat = (plan: 'monthly' | 'annual') => {
        const id = premiumPriceId(plan) ?? '';
        const gross = preview.gross.value[id];
        return preview.plusVat.value[id] && gross
            ? t('pricing.inclVat').replace('{price}', gross)
            : '';
    };
    const saving = computed(() => {
        const monthly = amount('monthly');
        const annual = amount('annual');
        if (!monthly || !annual) {
            return 0;
        }
        if (monthly.amount <= 0 || monthly.currency !== annual.currency) {
            return 0;
        }
        return Math.max(0, Math.round((1 - annual.amount / (monthly.amount * 12)) * 100));
    });
    const saveLabel = computed(() =>
        saving.value
            ? t('billing.subscription.save').replace('{percent}', String(saving.value))
            : '',
    );
    const perMonth = computed(() => {
        const annual = amount('annual');
        return annual ? formatMoney({ ...annual, amount: annual.amount / 12 }, current.value) : '—';
    });
    onMounted(() => {
        void load();
    });
    return { ...preview, failed, price, inclVat, amount, saving, saveLabel, perMonth };
};
