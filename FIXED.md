# Mnemio — Fixed Bugs

All bugs fixed from `BUG_HANDOFF.md` plus additional issues found during code review.

---

## From BUG_HANDOFF.md

### BUG-2606-1 — Reword AI text on home page
- **Root cause:** `landing.aiBubble1` and `landing.aiBubble2` contained nonsensical copy referencing a word the user never set.
- **Fix:** Rewrote both bubble strings in `en.json` and `uk.json` to sensible conversational text.
- **Files:** `app/i18n/en.json`, `app/i18n/uk.json`

### BUG-2606-2 — Explanations ignore selected Ukrainian language
- **Root cause:** `streamMessage` in `app/api/chat.ts` did not forward the user's locale to the backend — always defaulting to English.
- **Fix:** Added `locale` parameter to `buildInit` and `streamMessage`; `useChat` reads `useI18n().locale` and passes it on every call.
- **Files:** `app/api/chat.ts`, `app/composables/useChat.ts`

### BUG-2606-3 — Flashcard clipped on mobile
- **Root cause:** `FlashCard.vue` used a fixed `min-h-[380px]` with no responsive variant, clipping content on small screens.
- **Fix:** `min-h-[280px] sm:min-h-[380px]`; front/back padding also made responsive.
- **Files:** `app/components/study/FlashCard.vue`

### BUG-2506-1 — Home page hero text hard to read on mobile
- **Root cause:** Hero body used `text-cream-dim` against a dark plum background — insufficient contrast.
- **Fix:** Changed to `font-medium text-cream`.
- **Files:** `app/pages/index.vue`

### BUG-2506-5 — Shift+Enter in AI chat sends instead of adding newline
- **Root cause:** `@keydown.enter.exact` modifier was not present; any Enter key (including Shift+Enter) submitted the form.
- **Fix:** Replaced with an `onEnterKey` handler that returns early when `e.shiftKey` is true.
- **Files:** `app/pages/ai.vue`

### BUG-2506-6 — Empty page after creating a deck (until manual refresh)
- **Root cause:** The card-add page grid used an inline `gridTemplateColumns: '1fr 400px'` style that always created a 2-column layout. On a 375 px screen the 400 px right column left 0 px for the form, rendering it invisible.
- **Fix:** Replaced with Tailwind `lg:grid-cols-[1fr_400px]` — single column on mobile, two columns on `lg+`.
- **Files:** `app/pages/decks/[id]/cards/add.vue`

### BUG-2506-7 — Card does not flip on tap
- **Root cause:** The preview card on the add-card page had no click handler and no flip state.
- **Fix:** Added `previewFlipped` ref, bound click to toggle it, and applied the flip transform.
- **Files:** `app/pages/decks/[id]/cards/add.vue`

### BUG-2506-8 — "Add & next" vs "Done" button emphasis swapped
- **Root cause:** "Done" was the primary button and "Add & next" was ghost — opposite of the intended flow.
- **Fix:** Swapped variants and positions: "Add & next" is now primary (right), "Done" is ghost (left).
- **Files:** `app/pages/decks/[id]/cards/add.vue`

### BUG-2506-9 — Interface shifts when selecting card difficulty
- **Root cause:** The radio-dot indicator used `v-if`, causing a DOM mount/unmount on each selection and a measurable layout shift.
- **Fix:** Replaced `v-if` with an `opacity` transition — element stays in the DOM, only visibility changes.
- **Files:** `app/pages/decks/[id]/cards/add.vue`

### BUG-2506-10 — AI Import button unreachable on deck list page
- **Root cause:** `AiImportDialog` was mounted on `/decks` but no button ever set `aiOpen = true`.
- **Fix:** Added a floating Mimi button (bottom-right, desktop only) that opens the dialog.
- **Files:** `app/pages/decks/index.vue`

### BUG-2506-11 — Chat creates new deck instead of appending to existing
- **Status:** Backend-only. The AI tool-use routing that decides whether to append or create is controlled server-side. Cannot be fixed on the frontend.

### BUG-2506-12 — Chat reports word added but nothing changes
- **Status:** Backend-only. Same root cause as BUG-2506-11.

### BUG-2506-13 — Backend deck language strings don't match frontend enum
- **Root cause:** AI-generated decks stored `sourceLanguage: "ENGLISH"` while the frontend expected ISO codes like `"en"`. The deck-edit form showed no language pre-selected.
- **Fix:** Added `normLang()` in `app/api/decks.ts` that maps full language names to ISO codes; applied in `getDeck` and `listDecks`.
- **Files:** `app/api/decks.ts`

### BUG-2506-14 — Card preview "Your word…" / "Tap to flip" not translated
- **Root cause:** Hardcoded English strings in the card add page template.
- **Fix:** Replaced with `t('card.previewWordPlaceholder')` and `t('card.tapToFlip')`; keys added to both `en.json` and `uk.json`.
- **Files:** `app/pages/decks/[id]/cards/add.vue`, `app/i18n/en.json`, `app/i18n/uk.json`

### BUG-2506-15 — Mimi replies in English despite Ukrainian being set
- **Root cause:** Same as BUG-2606-2 — locale was not forwarded to the chat API.
- **Fix:** Covered by the same fix as BUG-2606-2.
- **Files:** `app/api/chat.ts`, `app/composables/useChat.ts`

---

## From Code Review (post-handoff)

### CR-01 — `normLang` returned null/undefined typed as string
- **Root cause:** `if (!raw) return raw` returned the raw null/undefined value. TypeScript masked it because the parameter was typed `string`. Any downstream `.toLowerCase()` call would crash at runtime.
- **Fix:** Changed to `if (!raw) return ''`.
- **Files:** `app/api/decks.ts`

### CR-02 — `createDeck` and `updateDeck` responses not language-normalized
- **Root cause:** `normLang` was only applied in `getDeck` and `listDecks`. Immediately after creating or editing a deck the store held un-normalized language strings (e.g. `"english"` instead of `"en"`), breaking AI enrichment and ISO-code comparisons until the next full list refresh.
- **Fix:** Both functions now normalize `sourceLanguage` and `targetLanguage` on their returned `DeckSummary`.
- **Files:** `app/api/decks.ts`

### CR-03 — Discover API never applied `normLang` to returned deck language fields
- **Root cause:** `listDecks`, `getFeatured`, and `copyDeck` in `discover.ts` returned raw backend strings. Public decks created by AI had full-word language names that broke language filters and display badges.
- **Fix:** Exported `normLang` from `decks.ts`; `discover.ts` now normalizes all returned `DeckWithAuthor` and `DeckSummary` shapes via a local `normDeck` helper.
- **Files:** `app/api/discover.ts`, `app/api/decks.ts`

### CR-04 — Mimi panel stayed open and blank after "Add & next"
- **Root cause:** `reset()` cleared `chatMessages` but did not reset `mimiOpen`. The panel remained visible with an empty body and no greeting, and the floating trigger button (hidden when `mimiOpen` is true) was unreachable.
- **Fix:** Added `mimiOpen.value = false` to `reset()`.
- **Files:** `app/pages/decks/[id]/cards/add.vue`

### CR-05 — Login form labels and email placeholder were hardcoded English
- **Root cause:** `label="Email address"`, `placeholder="example@mail.com"`, and `label="Password"` were literal strings not going through `t()`. Every other string on the login page was translated to Ukrainian while these stayed in English.
- **Fix:** Added `auth.emailLabel`, `auth.emailPlaceholder`, and `auth.passwordLabel` keys to both `en.json` and `uk.json`; updated the template to use `t()`.
- **Files:** `app/components/login/AuthForm.vue`, `app/i18n/en.json`, `app/i18n/uk.json`

### CR-06 — Login form check icons used `v-if`, causing layout shift on input
- **Root cause:** `<Check v-if="isEmailValid">` and `<Check v-if="isPasswordValid">` mounted/unmounted the icon on each keystroke, shifting the input's right edge — the same bug class as BUG-2506-9.
- **Fix:** Replaced `v-if` with an `opacity` transition class binding. The icon stays in the DOM; only visibility changes.
- **Files:** `app/components/login/AuthForm.vue`

### CR-07 — Chat session expiry silently failed instead of redirecting to login
- **Root cause:** When `refreshAccessToken()` returns `null` (expired refresh cookie), `chat.ts` proceeded to retry the SSE request with no auth header, got a second 401, and called `onError({ code: 'NETWORK_ERROR' })`. The user saw a generic chat error instead of being sent to `/login`, unlike `http.ts` which calls `onAuthFailure()` on the same condition.
- **Fix:** After a null refresh result, `streamMessage` now calls `navigateTo('/login?reason=session_expired')` and returns early.
- **Files:** `app/api/chat.ts`

### CR-08 — Feature cards, FAQ answers, and AI/CTA section body text had low contrast
- **Root cause:** Five sections on the landing page used `text-cream-dim` for body copy on dark `bg-bg-surface` backgrounds — the same contrast issue BUG-2506-1 fixed on the hero, but left unaddressed in the rest of the page.
- **Fix:** Changed all five instances to `text-cream` (feature card bodies, how-it-works step bodies, AI section body, FAQ answers, final CTA subtitle).
- **Files:** `app/pages/index.vue`

---

## Ukrainian translation quality pass

All Ukrainian strings were audited for naturalness. 24 changes applied:

- **English calques removed:** "Ви палаєте" → "Ви у формі", "майбутній ви" → "потім подякуєте собі", "нейронам відпочити" → "мозок відпочине", "рознесу далі в часі" → "відкладу повторення на довше"
- **Formal phrasing replaced:** "Залишатися в системі" → "Запам'ятати мене", "Серію забезпечено" → "Серія продовжується", "Спокій за задумом" → "Без тиску"
- **Borrowed words replaced:** "Білінг" → "Оплата" throughout, "інсайти" → "рекомендації"
- **Wrong/mismatched strings fixed:** "Правильних карток" → "Вивчено карток", "поблажливо" → "легко", status "Пробний" → "Пробна", demo "Складно" → "Важко"
- **Files:** `app/i18n/uk.json`
