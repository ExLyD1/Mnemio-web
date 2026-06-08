import { setApiBase } from '@/utils/http';

/**
 * Resolve the API base URL once, in proper plugin context, into the http module.
 * Runs before `01.auth.client.ts` (which calls http via hydrate) so every
 * request has the base without http() ever calling a Nuxt composable itself.
 */
export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();
    setApiBase(config.public.apiBase);
});
