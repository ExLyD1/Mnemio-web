import type { Paddle, PricePreviewParams, PricePreviewResponse } from '@paddle/paddle-js';
import { ref, watch, type Ref } from '#imports';
import { ALL_PRICE_IDS, TAX_INCLUSIVE_COUNTRIES } from '@/data/plans';
import type { Money } from '@/types/billing';
import { fromMinorUnits } from '@/utils/format';

/** `priceId` → the already-formatted price to display, e.g. `"$8.00"`. */
export type PaddlePrices = Record<string, string>;

/**
 * What to show for one price. Outside the tax-inclusive countries we show the
 * price BEFORE VAT (the checkout adds it) whenever VAT applies; in Ukraine, or when
 * we can't tell the country, we show Paddle's total — always the amount charged.
 */
const showsNet = (
    res: PricePreviewResponse,
    item: PricePreviewResponse['data']['details']['lineItems'][number],
    fallbackCountry: string | null,
) => {
    const country = res.data.address?.countryCode ?? fallbackCountry;
    return !!country && !TAX_INCLUSIVE_COUNTRIES.includes(country) && Number(item.totals.tax) > 0;
};

/**
 * Fetches localized totals for every purchasable price in one `PricePreview()`
 * call.
 *
 * Both the monthly and annual price IDs go in the same request, so flipping the
 * billing-cycle toggle is free — it just reads a different key out of the map. Do
 * not re-fetch on cycle change.
 *
 * `country` is a two-letter ISO code or `null`. When it's `null` we omit `address`
 * entirely so Paddle geolocates from the visitor's IP; there is no "unknown"
 * sentinel to accidentally send as a country code.
 */
export const usePaddlePrices = (
    paddle: Ref<Paddle | undefined>,
    country: Ref<string | null> | string | null,
) => {
    const prices = ref<PaddlePrices>({});
    /** `priceId` → true when `prices` is before VAT (show "+ VAT"). */
    const plusVat = ref<Record<string, boolean>>({});
    /** `priceId` → Paddle's formatted total including VAT. */
    const gross = ref<PaddlePrices>({});
    const amounts = ref<Record<string, Money>>({});
    const loading = ref(true);
    const error = ref(false);

    const countryRef = typeof country === 'object' && country !== null ? country : ref(country);

    const fetchPrices = async () => {
        const instance = paddle.value;
        if (!instance || ALL_PRICE_IDS.length === 0) {
            return;
        }

        loading.value = true;
        error.value = false;
        try {
            const cc = countryRef.value;
            const params = {
                items: ALL_PRICE_IDS.map((priceId) => ({ priceId, quantity: 1 })),
                ...(cc ? { address: { countryCode: cc } } : {}),
            } as PricePreviewParams;

            const res = await instance.PricePreview(params);
            const items = res.data.details.lineItems;
            const net = new Map(items.map((i) => [i.price.id, showsNet(res, i, cc)]));
            prices.value = Object.fromEntries(
                items.map((i) => [
                    i.price.id,
                    net.get(i.price.id) ? i.formattedTotals.subtotal : i.formattedTotals.total,
                ]),
            );
            plusVat.value = Object.fromEntries(
                items.map((i) => [i.price.id, !!net.get(i.price.id)]),
            );
            gross.value = Object.fromEntries(
                items.map((i) => [i.price.id, i.formattedTotals.total]),
            );
            amounts.value = Object.fromEntries(
                items.map((item) => [
                    item.price.id,
                    {
                        amount: fromMinorUnits(
                            net.get(item.price.id) ? item.totals.subtotal : item.totals.total,
                            res.data.currencyCode,
                        ),
                        currency: res.data.currencyCode,
                    },
                ]),
            );
        } catch (e) {
            // A wrong-environment price ID lands here ("price not found").
            console.error('[paddle] PricePreview failed', e);
            error.value = true;
        } finally {
            loading.value = false;
        }
    };

    watch([paddle, countryRef], fetchPrices, { immediate: true });

    return { prices, plusVat, gross, amounts, loading, error, refresh: fetchPrices };
};
