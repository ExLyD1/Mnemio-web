import type { Paddle, PricePreviewParams, PricePreviewResponse } from '@paddle/paddle-js';
import { ref, watch, type Ref } from '#imports';
import { ALL_PRICE_IDS } from '@/data/plans';
import type { Money } from '@/types/billing';
import { fromMinorUnits } from '@/utils/format';

/** `priceId` → Paddle's already-formatted total, e.g. `"£8.00"`, `"149.00 ₴"`. */
export type PaddlePrices = Record<string, string>;

const toPriceMap = (res: PricePreviewResponse): PaddlePrices =>
    res.data.details.lineItems.reduce<PaddlePrices>((acc, item) => {
        acc[item.price.id] = item.formattedTotals.total;
        return acc;
    }, {});

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
            prices.value = { ...prices.value, ...toPriceMap(res) };
            amounts.value = Object.fromEntries(
                res.data.details.lineItems.map((item) => [
                    item.price.id,
                    {
                        amount: fromMinorUnits(item.totals.total, res.data.currencyCode),
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

    return { prices, amounts, loading, error, refresh: fetchPrices };
};
