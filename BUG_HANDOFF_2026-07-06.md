9999999999888# Mnemio — Bug Handoff for Claude Code

**Source:** "Mnemio правки.pdf" (screenshot report, 21 issues)
**Generated:** 2026-07-06
**Previous batch:** see `BUG_HANDOFF.md` (2026-06-26). Some issues here are follow-ups to items not fully closed there.

## How to read this

- Each bug keeps the original Ukrainian text, an English summary, the device it reproduces on, and a **Suggested fix** — the likely root cause and where to look.
- Screenshots exist in the source PDF but are not reproduced here; descriptions are self-contained.
- Treat "Suggested fix" as a starting hypothesis, not a spec. Confirm against the actual code before changing.

**Total issues: 21.** Grouped below by theme for efficient batching.

---

## A. Localization / translation (selected UA language ignored)

### BUG-0706-08 — Achievements shown in English despite Ukrainian setting

- **UA:** Досягнення написані англійською мовою хоча стоїть в налаштуваннях українська мова.
- **EN:** Achievement titles/descriptions render in English while app language = Ukrainian.
- **Device:** mobile, desktop
- **Suggested fix:** Achievement strings are likely hardcoded or seeded in English rather than pulled from the i18n catalog. Move them into the localization files and key them; ensure the achievements component reads the active locale. Related to the language-preference issues in the previous batch (BUG-2606-2, 2506-15).

### BUG-0706-15 — Review words not translated (all English)

- **UA:** Не працює перевод в словах для повторення, все має бути на укр мові але все на англ.
- **EN:** On the review/repetition screen, UI (and/or word metadata) that should be Ukrainian is entirely English.
- **Device:** mobile, desktop
- **Suggested fix:** Same root as BUG-0706-08 — the review screen isn't resolving strings through i18n, or the locale isn't propagated into that route. Audit the review component for hardcoded strings and confirm the locale context is available there.

### BUG-0706-16 — "0% mastered" label not translated

- **UA:** Теж не працює перевод, написано "0% mastered", не переклалось.
- **EN:** The mastery label "0% mastered" stays in English.
- **Device:** mobile, desktop
- **Suggested fix:** Add a translation key for the mastery/progress label (e.g. `{percent}% опановано`) and replace the literal string. Group with BUG-0706-08/15 as one localization pass.

---

## B. Progress / statistics not counted correctly

### BUG-0706-11 — Daily reviewed-cards count not recorded

- **UA:** Додаток не зараховує скільки я в день переглянув карток.
- **EN:** The number of cards reviewed in a day is not being counted/persisted.
- **Device:** mobile, desktop
- **Suggested fix:** Verify the review event is actually written on each card review (API call fires, backend increments the daily counter, date bucketed in the user's timezone). Likely the mutation isn't sent, isn't awaited, or the daily aggregation query is wrong. Root cause for BUG-0706-14 and -19 too.

### BUG-0706-12 — Deck shows 0% learned after 4 passes

- **UA:** Ця колода не може бути вивченою на 0% тому що я її проходив 4 рази.
- **EN:** A deck the user completed 4 times still displays 0% learned.
- **Device:** mobile, desktop
- **Suggested fix:** The per-deck mastery/progress isn't updated (or not read) after study sessions. Check that card SRS state (ease/interval/reps) is saved and that deck-progress is derived from it. Same class of bug as BUG-0706-21.

### BUG-0706-14 — Practice shows 0 after completing it

- **UA:** Показано 0 хоча я вмикав практику й пройшов її.
- **EN:** A completed practice session still reports 0.
- **Device:** mobile, desktop
- **Suggested fix:** Practice-completion event not persisted, or the stat reads a different field than the one written. Trace the practice-finish handler to the stat that renders 0. Group with BUG-0706-11.

### BUG-0706-19 — "Cards reviewed" chart shows many 2s

- **UA:** Переглянуто карток зроблено якось дивно, чому під графіками багато двійок.
- **EN:** The reviewed-cards chart looks wrong — lots of repeated "2" values under the graphs.
- **Device:** mobile, desktop
- **Suggested fix:** Likely a data-aggregation/axis issue: duplicated buckets, wrong groupBy, or a hardcoded/placeholder value. Inspect the query feeding the chart and the axis label rendering. Depends on BUG-0706-11 being fixed first.

### BUG-0706-21 — Repeated decks still show 0% learned

- **UA:** Ці колоди я повторяв але чомусь тут показується що вони вивчені на 0%.
- **EN:** Decks the user has repeated display 0% learned.
- **Device:** mobile, desktop
- **Suggested fix:** Duplicate of BUG-0706-12 in a different view. Fix deck-progress derivation once and confirm all surfaces (deck list + deck detail) read the same source.

### BUG-0706-17 — Completed weekly goal should reset/refresh

- **UA:** Тижнева ціль виконана — якщо вона виконана можна зробити щоб вона оновлювалася.
- **EN:** Once the weekly goal is met, it stays "done"; it should roll over/refresh for the new week.
- **Device:** mobile, desktop
- **Suggested fix:** Add weekly reset logic — compute the goal window from the current ISO week (user timezone) so it auto-resets, instead of persisting a one-time "completed" flag. Optionally show a "goal reached" state until the week rolls.

---

## C. Study-flow logic

### BUG-0706-10 — Empty deck asks if user is ready to study

- **UA:** Не логічно звучить те що в колоді з 0 карт питають чи він готовий вчитись.
- **EN:** A deck with 0 cards still prompts "ready to study?" — illogical.
- **Device:** mobile, desktop
- **Suggested fix:** Guard the study CTA on `cardCount > 0`. For empty decks show an empty state ("Add cards to start") instead of the study prompt.

### BUG-0706-20 — AI-generated deck shows artifacts on every card

- **UA:** Коли генерував колоду через ШІ, отаке почало з'являтися на кожній карточці.
- **EN:** After AI deck generation, an unwanted artifact/garbage appears on every card (see PDF screenshot).
- **Device:** mobile, desktop
- **Suggested fix:** Likely the AI response isn't parsed/sanitized before saving — raw markdown, JSON fragments, escape sequences, or a template placeholder leaking into card fields. Inspect the AI-generation parser and card-field mapping; add validation/trimming. **Needs the PDF screenshot to confirm the exact artifact.**

---

## D. UI consistency & theming

### BUG-0706-02 — Sidebar colors still not fixed (active item)

- **UA:** Все ще не пофікшені кольори сайдбару. Замінити колір активної сторінки.
- **EN:** Sidebar colors remain unfixed; change the active-page highlight color.
- **Device:** mobile, desktop
- **Suggested fix:** Update the active nav-item token in the sidebar component/theme. Carried over from a prior batch — confirm the token is actually applied and not overridden by a more specific rule.

### BUG-0706-03 — Achievement colors blend in

- **UA:** Змінити колір ачівок, бо зливаються.
- **EN:** Achievement elements blend into the background — poor contrast.
- **Device:** mobile, desktop
- **Suggested fix:** Raise contrast between achievement cards/badges and the background (both themes). Verify against WCAG AA. Consider running the `design:accessibility-review` skill on this screen.

### BUG-0706-04 — Chat list item needs marker + light-theme font color

- **UA:** Додати якусь точку чи риску перед назвою, та змінити колір шрифту у світлій версії. Ситуативно: додати розділювач між кнопкою та чатами.
- **EN:** Add a dot/dash marker before the chat title and fix font color in light theme; optionally add a divider between the button and the chat list.
- **Device:** mobile, desktop
- **Suggested fix:** Add a leading bullet/marker element to the chat list item, correct the light-theme text token for legibility, and add a separator between the action button and the list.

### BUG-0706-05 — Two different fonts in chat UI

- **UA:** Два різні шрифти: один у виборі чатів, інший зверху у самому чаті.
- **EN:** The chat-selection list and the in-chat header use different fonts.
- **Device:** mobile, desktop
- **Suggested fix:** Unify to the design-system font family. Find the header component overriding `font-family` (or missing the base font) and align it with the list.

### BUG-0706-06 — "Cards per day" count font color

- **UA:** Змінити колір шрифту кількості карток за день.
- **EN:** Change the text color of the cards-per-day count for legibility.
- **Device:** mobile, desktop
- **Suggested fix:** Swap the hardcoded color for a theme token with sufficient contrast in both themes.

### BUG-0706-13 — Answer options styling inconsistent

- **UA:** Варіанти відповідей треба зробити однаковими: щоб вони були чи повністю заповнені кольором чи пусті.
- **EN:** Answer-option buttons are inconsistent — some filled, some empty. Make them uniform (all filled or all outline).
- **Device:** mobile, desktop
- **Suggested fix:** Normalize the option-button variant so all options share one style; only the selected/correct/incorrect states should differ, driven by state props rather than ad-hoc styling.

---

## E. Chat / Mimi assistant

### BUG-0706-07 — Duplicate AI-import controls + floating Mimi

- **UA:** Дві кнопки які роблять одне і те саме — Імпорт з ШІ та іконка мімі + 2 іконки мімі на одному екрані, прибрати літаючу мімі.
- **EN:** "AI Import" and the Mimi icon do the same thing, and two Mimi icons appear on one screen. Remove the floating Mimi.
- **Device:** mobile, desktop
- **Suggested fix:** De-duplicate the entry points — keep one canonical trigger, remove the floating Mimi FAB where the "AI Import" button already exists. Relates to prior-batch BUG-2506-10 (the intended affordance).

### BUG-0706-09 — Text overflows/wraps while typing to Mimi

- **UA:** Коли ти пишеш мімі, текст переноситься.
- **EN:** While typing in the Mimi input, text wraps/overflows unexpectedly.
- **Device:** mobile, desktop
- **Suggested fix:** Fix the input/textarea sizing — allow proper auto-grow or scroll, correct `white-space`/`overflow`/`width` so text doesn't break the layout. Sibling to prior-batch BUG-2506-5 (Shift+Enter behavior).

---

## F. Layout / navigation

### BUG-0706-01 — Landing flash then blocks slide down on first load

- **UA:** При першому відкритті сторінки 3 секунди відкрито лендінг незареєстрованого юзера, потім перекидує на головну сторінку та блоки з'їжджають вниз під усе. Фікситься тільки після перезавантаження.
- **EN:** On first load, the unauthenticated landing page shows for ~3s, then redirects to the main page and the layout blocks slide down/below everything. Only a manual reload fixes it.
- **Device:** desktop
- **Suggested fix:** Auth/redirect race on initial hydration. Gate rendering on resolved auth state (show a loader/skeleton instead of the landing flash), and fix the post-redirect layout so blocks mount in the correct order without needing a reload. Check for a hydration mismatch or a late-applied CSS/layout class.

### BUG-0706-18 — Activity view requires scrolling right; start from left

- **UA:** Активність переробити, тому що щоб її побачити треба пролистати вправо. Зробити щоб вона починалась зліва.
- **EN:** The activity chart/heatmap is initially scrolled to the right; the user must scroll left to see current data. Make it start left (or default-scroll to the latest/leftmost meaningful position).
- **Device:** mobile, desktop
- **Suggested fix:** Set the initial horizontal scroll/anchor of the activity component so the relevant range is visible by default, or reverse the layout direction. Verify on mobile widths.

---

## Suggested batching order

1. **Progress/stats (Section B)** — highest user impact; BUG-0706-11 is the shared root cause for -12, -14, -19, -21. Fix persistence + aggregation first, then the display bugs collapse.
2. **Localization (Section A)** — one i18n pass covers -08, -15, -16 (and closes out prior-batch language issues).
3. **Study-flow logic (Section C)** — -10 (guard) is quick; -20 needs the screenshot to confirm the artifact.
4. **UI/theming (Section D)** — batch as a styling/token pass; run `design:accessibility-review` for contrast items (-03, -06).
5. **Chat/Mimi (Section E)** and **Layout (Section F)** — independent, can be parallelized.

## Notes for the implementer

- BUG-0706-20 (AI card artifact) and any pixel-specific theming decisions may need the original PDF screenshots — ask for them before implementing if the description is ambiguous.
- Several items are marked "still not fixed" / "also" — cross-check against `BUG_HANDOFF.md` so a regression isn't re-introduced.
