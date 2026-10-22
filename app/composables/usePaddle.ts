import {
    initializePaddle,
    type Paddle,
    type Environments,
    type PaddleEventData,
} from '@paddle/paddle-js';
import { ref, shallowRef, useRuntimeConfig } from '#imports';

/**
 * Paddle.js loader.
 *
 * Paddle.js is a browser-only singleton — `initializePaddle()` warns and refuses
 * on a second call — so the instance lives at module scope and is shared by every
 * caller. The promise is cached too, so two components mounting in the same tick
 * await the same load instead of racing.
 *
 * Unlike the rest of our networking this does NOT go through `utils/http.ts`:
 * Paddle.js talks to Paddle's own API with its own client token, not to our
 * backend.
 */

const VALID_ENVS = ['sandbox', 'production'] as const;

const paddle = shallowRef<Paddle | undefined>();
const loading = ref(false);
/** Set when config is missing/invalid or the script fails — gates the UI. */
const failed = ref(false);
let inflight: Promise<Paddle | undefined> | null = null;
const subscribers = new Set<(event: PaddleEventData) => void>();

export const usePaddle = () => {
    const config = useRuntimeConfig();

    const load = async (): Promise<Paddle | undefined> => {
        if (failed.value) {
            return undefined;
        }
        if (paddle.value) {
            return paddle.value;
        }
        if (inflight) {
            return inflight;
        }

        // Both are typed `string` and default to '' in nuxt.config.ts.
        const token = config.public.paddleClientToken;
        const env = config.public.paddleEnv;

        // Fail loudly rather than defaulting. A silent default here would point a
        // sandbox build at the live account (or vice versa) and take real money
        // against test prices. We refuse to initialise and let the page render its
        // "billing unavailable" state instead.
        if (!token || !env) {
            console.error(
                '[paddle] NUXT_PUBLIC_PADDLE_CLIENT_TOKEN and NUXT_PUBLIC_PADDLE_ENV must both be set. Refusing to initialise Paddle.js.',
            );
            failed.value = true;
            return undefined;
        }
        if (!(VALID_ENVS as readonly string[]).includes(env)) {
            console.error(
                `[paddle] NUXT_PUBLIC_PADDLE_ENV must be one of ${VALID_ENVS.join(' | ')} — got "${env}". Refusing to initialise Paddle.js.`,
            );
            failed.value = true;
            return undefined;
        }
        // A sandbox token against a production env (or the reverse) fails at
        // checkout-open time with an opaque error, so catch the mismatch here.
        const isTestToken = token.startsWith('test_');
        if (isTestToken !== (env === 'sandbox')) {
            console.error(
                `[paddle] token/environment mismatch: a ${isTestToken ? 'sandbox (test_)' : 'production'} token was given with NUXT_PUBLIC_PADDLE_ENV="${env}". Refusing to initialise Paddle.js.`,
            );
            failed.value = true;
            return undefined;
        }

        loading.value = true;
        inflight = initializePaddle({
            token,
            environment: env as Environments,
            eventCallback: (event) => {
                for (const listener of subscribers) {
                    listener(event);
                }
            },
        })
            .then((instance) => {
                if (!instance) {
                    failed.value = true;
                    return undefined;
                }
                paddle.value = instance;
                return instance;
            })
            .catch((e) => {
                console.error('[paddle] failed to load Paddle.js', e);
                failed.value = true;
                return undefined;
            })
            .finally(() => {
                loading.value = false;
                inflight = null;
            });

        return inflight;
    };

    const subscribe = (listener: (event: PaddleEventData) => void) => {
        subscribers.add(listener);
        return () => {
            subscribers.delete(listener);
        };
    };
    return { paddle, load, loading, failed, subscribe };
};
