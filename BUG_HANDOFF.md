# Mnemio — Bug Handoff for Claude Code

**Source:** Google Doc "Mnemio правки" (tabs = dated folders)
**Generated:** 2026-06-26
**Scope:** Every bug NOT marked green (i.e. not yet fixed). Green-highlighted rows = already done and excluded. Empty placeholder rows excluded.

## How to read this
- Bugs are grouped by the document folder (date tab) they came from.
- Each bug keeps its original Ukrainian text plus an English summary so nothing is lost in translation.
- `Device` = where the bug reproduces (mobile / desktop).
- Folder **24.06.2026** has **no** outstanding bugs — every entry there was green (fixed). It is omitted.

**Total outstanding bugs: 15** (3 in 26.06, 12 in 25.06).

---

## Folder: 26.06.2026 (newest)

### BUG-2606-1 — Reword AI text on home page
- **UA:** Текст з AI на головній сторінці потрібно замінити на щось більш логічне, він недоречний.
- **EN:** The AI-generated text on the home page is awkward/irrelevant — replace it with something more sensible.
- **Device:** mobile, desktop

### BUG-2606-2 — Explanations ignore selected Ukrainian language
- **UA:** Коли обираю пояснення на українській мові, все одно всі пояснення записуються англійською мовою.
- **EN:** When Ukrainian is selected as the explanation language, explanations are still saved/generated in English. Language preference is not being applied.
- **Device:** mobile, desktop

### BUG-2606-3 — Flashcard clipped on mobile (needs responsive design)
- **UA:** На мобілці на сторінці вивчення слів у моді flashcards, обрізається картка через обмежену максимальну висоту і не бачу тексту, потрібно щоб був responsive design.
- **EN:** On mobile, in the word-study flashcards mode, the card is clipped by a fixed max-height so the text isn't visible. Make the card responsive.
- **Device:** mobile

---

## Folder: 25.06.2026

### BUG-2506-1 — Home page text hard to read on mobile
- **UA:** Коментар від користувача: "текст маленький, приходиться сильно напружувати очі". New info (upd): "Із-за фона ти наче вглядуєшся в той текст. Ти з початку знайомишся з меню, що як треба прочитати всі клавіши. Яскравість телефону треба крутити на мах + Екран телефона стає як дзеркало, відбиває оточуюче світло."
- **EN:** Text is too small / low-contrast on mobile — users strain to read it. The background makes text hard to make out, phone brightness has to be maxed, and the screen acts like a mirror reflecting ambient light. Improve text size and contrast against the background.
- **Reference:** https://share.google/aimode/krwdSyyiG3yrbUZ9
- **Device:** mobile

### BUG-2506-5 — Shift+Enter in side chat should add a newline, not send
- **UA:** В боковому чаті коли натискаю shift + enter має переносити на нову строку, а не відправляти повідомлення.
- **EN:** In the side chat, Shift+Enter should insert a newline instead of submitting the message.
- **Device:** mobile, desktop

### BUG-2506-6 — Empty page after creating a deck (until manual refresh)
- **UA:** Коли створив колоду і натиснув кнопку "Створити і додавати картки", мене перекинуло на сторінку, яка пуста і немає нічого. Лише після оновлення сторінки з'являється UI.
- **EN:** After creating a deck and clicking "Create and add cards", the user is redirected to a page that renders empty — the UI only appears after a manual page refresh. Fix the data load / render on navigation.
- **Reference URL pattern:** `https://mnemio.xyz/decks/{deckId}/cards/add`
- **Device:** mobile, desktop

### BUG-2506-7 — Card does not flip on tap
- **UA:** Коли додаю картку і натискаю на неї (де є текст "tap to flip"), то вона не обертається.
- **EN:** Tapping a card that shows "tap to flip" does not flip it.
- **Device:** mobile, desktop

### BUG-2506-8 — "Add & next" vs "Done" button emphasis
- **UA:** Кнопку "Add & next" краще зробити якраз обведеною, щоб юзеру кидалось в очі, а кнопку "Done" не такою яскравою (тип, поміняти їх стилями і місцями).
- **EN:** Make the "Add & next" button the visually prominent (outlined/primary) one, and make "Done" less prominent — effectively swap their styling/placement.
- **Device:** mobile, desktop

### BUG-2506-9 — Interface shifts when adding a card (difficulty selector)
- **UA:** Коли додаю картку, то там, де складність картки, трошки пливе інтерфейс.
- **EN:** When adding a card, the UI around the card-difficulty control shifts/jitters (layout instability).
- **Device:** mobile, desktop

### BUG-2506-10 — AI Import button broken + add quick-import affordance
- **UA:** На сторінці колоди кнопка "Import з ШІ" не працює. І на сторінці колоди потрібно, щоб також був мімі справа знизу в кутку, щоб відразу імпортити слова.
- **EN:** The "Import with AI" button on the deck page doesn't work. Also add a bottom-right (mini/"Mimi") affordance on the deck page to import words directly.
- **Device:** mobile, desktop

### BUG-2506-11 — Chat creates a new deck instead of adding to existing
- **UA:** Коли в чаті попросив додати певні картки в вже існуючу колоду, воно створило нову, замість того щоб додати вже в існуючу.
- **EN:** When asked via chat to add specific cards to an existing deck, the system created a new deck instead of appending to the existing one.
- **Device:** mobile, desktop

### BUG-2506-12 — Chat reports word added but nothing changes
- **UA:** Коли в вже існуючу колоду попросив додати 1 слово, він відписав, що додав, але насправді нічого не змінилось.
- **EN:** When asked to add 1 word to an existing deck, the assistant replied that it was added, but in reality nothing changed. (Likely related to BUG-2506-11.)
- **Device:** mobile, desktop

### BUG-2506-13 — Backend deck language mismatch with frontend
- **UA:** Бекенд має повертати такі ж самі дані, як і фронт. Тобто коли я попросив AI створити для мене колоду, він створив, та там було написано, що лицева сторона ENGLISH, а відповідь UKRAINIAN. Хоча в форматуванні фронта має бути EN → UK. Та коли я зайшов в редагування колоди, то там не було обрано якісь мови по дефолту — значить, що вони не співпадають з типізацією на фронті.
- **EN:** Backend should return data consistent with the frontend. An AI-created deck stored front = ENGLISH, answer = UKRAINIAN, while the frontend formatting expects EN → UK. In the deck-edit screen no language was selected by default, meaning backend values don't match the frontend's typing/enum. Align backend language fields with frontend expectations.
- **Device:** mobile, desktop

### BUG-2506-14 — Flashcard front not translated to Ukrainian
- **UA:** Не переведено на укр мову (картка "Your word…").
- **EN:** Flashcard front (e.g. the "Your word…" placeholder) is not translated to Ukrainian. Apply Ukrainian localization.
- **Device:** mobile, desktop

### BUG-2506-15 — Mimi (AI) replies in English despite Ukrainian default
- **UA:** Мімі пише на англ, коли в мене обрана укр мова по дефолту.
- **EN:** The "Mimi" AI assistant responds in English even though Ukrainian is set as the default language. (Related to BUG-2606-2 — language preference not respected.)
- **Device:** mobile, desktop

---

## Suggested themes for batching the fixes
- **Localization / language preference** (BUG-2606-2, 2506-13, 2506-14, 2506-15): explanations, AI replies, and deck data ignore the selected Ukrainian language.
- **Deck/card mutation via chat** (BUG-2506-11, 2506-12): adding to an existing deck creates a new one or silently no-ops.
- **Responsive / layout** (BUG-2606-3, 2506-1, 2506-9): mobile clipping, contrast, and jitter.
- **Card interactions** (BUG-2506-7, 2506-8): tap-to-flip and button emphasis.
- **Deck creation/import flow** (BUG-2506-6, 2506-10): empty page after create, broken AI import.
