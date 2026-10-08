/**
 * Word-completion (#6) and translation-suggestion (#7) lookups for the card
 * editor. Backed by our own Nitro routes (server/routes/_lex/*), which in
 * turn proxy free third-party services (Wiktionary, MyMemory) — see those
 * files for why.
 *
 * DELIBERATELY does not use `utils/http.ts`: that wrapper prefixes every path
 * with `/api/v1` and attaches the user's bearer token, neither of which
 * applies here — `/_lex/*` is this app's own same-origin Nitro route, not the
 * backend, and needs no auth. This is a third such exception alongside
 * `chat.ts` (SSE) and `publicHttp.ts` (SSR) — see CLAUDE.md.
 */

interface LexResult {
    items: string[];
    degraded?: boolean;
}

/** Candidate word completions for `q` in the given language (2-letter code). */
export const completeWord = (lang: string, q: string, signal?: AbortSignal): Promise<string[]> =>
    $fetch<LexResult>('/_lex/complete', { query: { lang, q }, signal }).then((r) => r.items);

/** Candidate translations of `q` from `from` to `to` (2-letter codes). */
export const translateTerm = (
    from: string,
    to: string,
    q: string,
    signal?: AbortSignal,
): Promise<string[]> =>
    $fetch<LexResult>('/_lex/translate', { query: { from, to, q }, signal }).then((r) => r.items);
