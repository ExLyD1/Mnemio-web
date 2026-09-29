# Mimi chat (`/ai`) — untested areas and retest checklist

Written for: whoever runs the next QA pass on the Mimi chat, in-house or via a
browser agent.

Source: the pre-production QA audit of `/ai` (2026-09-25, Claude in Chrome).
That pass found 27 bugs; the fixes are in the commits referenced at the bottom.
This file records what that pass could **not** cover, why, and what is needed to
cover it — plus the reproductions to rerun now that the fixes have landed.

Nothing here is known-broken. These are gaps in coverage, not open defects.

---

## 1. Untested areas

### Image input (whole area)

**Why:** skipped by agreement; the agent could not produce image files in the
browser.
**Needs:** a fixture set committed somewhere the tester can reach —

1. a clean photo or screenshot of a word list;
2. the same image plus an instruction ("only nouns", "translate to Ukrainian");
3. an image with no learnable text (a landscape, a logo);
4. a file over 5 MB;
5. a `.txt` renamed to `.png`;
6. a blurry or handwritten list.

**What to check:** the deck matches what is visible; an image-only message is
accepted; no-text images get a text reply and **no** deck; oversized and
unsupported files produce a translated error and no stuck state; nothing is
invented from a blurry image. Image turns are metered under the `image` cap, not
`chat`.

### Message length boundary

**Why:** ran out of daily budget.
**Needs:** ~1 turn. Send exactly 4000 characters — it must go through. 4001 must
be blocked client-side, with the draft preserved (there is now a counter from
3500 and the Send button disables).

### Special characters, markup and scripts

**Why:** the daily cap was reached mid-test.
**Needs:** ~6 turns covering URLs, markdown, `<b>x</b>`, `<script>alert(1)</script>`,
code snippets, tabs and newlines in a word list, emoji, mixed Latin + Cyrillic +
CJK, an RTL language, a 200-character deck title, and an emoji-only title.
**What to check:** rendering and escaping in both the chat bubble and the deck
page, no XSS, no encoding corruption, and the title cap (titles are trimmed to
120 characters server-side).

### Gibberish and nonsense words

**Why:** budget.
**What to check:** does the model flag them, or invent confident translations?
Unfillable words are saved with an empty definition and the `ai-unfilled` tag.

### Switching the deck context mid-conversation

**Why:** at the time there was no way to attach a deck at all.
**Now testable:** attach deck A, add a word, switch the chip to deck B, add
another. The second must land in B. Naming a third deck in the message must be
refused (`DECK_MISMATCH`) with nothing written.

### Long-conversation context retention

**Why:** budget.
**Needs:** ~15 turns. Watch for self-contradiction, and confirm the model is not
re-answering an earlier question (the history bug that caused this is fixed, but
this is the behavioural check for it).

### Duplicate deck on Retry after a mid-stream reload

**Why:** budget ran out before the exact sequence could be run. This was the
open question the audit flagged as "assume it duplicates until proven
otherwise".
**Needs:** ~3 turns, and a reliably slow `create_deck`. Ask for a deck, reload
about 2 s in, then use Retry if it is offered.
**Expected now:** the reload shows a typing indicator and then the finished
reply (the message is `streaming`, not `partial`), so there is nothing to retry.
If the turn genuinely died after the deck was written, the partial message keeps
its deck attachment and Retry is hidden. A retry that does happen sends
`retryOf`, which replaces the failed pair rather than appending a second one.

### Narrow / mobile viewport

**Why:** the agent's `resize_window` changed `outerWidth` only, so the layout
never actually reflowed.
**Needs:** either a human at a phone width, or device emulation over the
DevTools protocol. Check the composer (deck chip, counter, usage line), the
sidebar drawer, and long deck titles.

### Forced failures: offline, throttling, 400/401/403/404/500, timeouts

**Why:** not safely triggerable from the extension.
**Needs:** a staging flag or a fault-injection endpoint. Until then, these are
covered only by unit tests and code review.
**What to check:** no stuck spinner, an understandable message, the input
recoverable, and the app still usable afterwards.

### Expired session in the UI (401 → refresh → retry)

**Why:** only verified at the API level.
**Needs:** a way to force token expiry on a test account.

### XSS end-to-end through assistant markdown

**Why:** the model refuses to emit raw HTML, so the sanitizer was only verified
indirectly.
**Needs:** a fixture assistant message containing raw HTML, or a test hook into
the renderer.

### How often the wrong-deck bug fired

**Why:** the audit saw it once in three attempts — far too small a sample.
**Needs:** a scripted run of 50+ phrasings ("add X to my Y deck", «додай X до
колоди Y», "put these in Y", …) against a fixed context deck. Every one must
either append to the open deck or refuse; none may write to another deck. The
guard is now deterministic server-side, so this is a regression check, not an
exploration.

### Real size and reset window of the generation budget

**Why:** unknowable from outside at the time.
**Now:** `GET /ai/usage` reports `used`, `cap` and `remaining` per kind plus
`resetsAt` (next UTC midnight). Free caps: 5 word-list decks, 20 topic decks,
50 chat messages, 10 images per day. Verify the composer's counter matches the
endpoint, and that the counter drops as decks are built.

---

## 2. Retest checklist (fixes to verify)

One line per bug from the audit. "Verify" is what a passing retest looks like.

| #   | Reproduction                                                                       | Verify                                                                                                              |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1   | Attach deck A, ask to add words "to my B deck"                                     | Refused, names both decks, nothing written to either                                                                |
| 2   | Open a deck → "Ask Mimi about this deck" → "add pear"                              | Chip shows the deck; the card lands there; the receipt says "+1 added"                                              |
| 3   | Create a deck via chat, check its stored languages                                 | Words language = `targetLanguage`, definitions = `sourceLanguage`. NOT a code bug — see "Deck language pairs" below |
| 4   | Create a Ukrainian deck, read every card                                           | No Russian words or letters (ы э ъ ё), correct agreement, «картки» not «карточки»                                   |
| 5   | Add a word the deck already has                                                    | Skipped, reported in the reply and on the card ("N already in this deck")                                           |
| 6   | Send two messages to one conversation at once (two tabs)                           | The second is refused (`CHAT_BUSY`); the stored reply is not corrupted                                              |
| 7   | Reload ~2 s into a long reply                                                      | Typing indicator, then the full reply. No false "interrupted"                                                       |
| 8   | Paste 4614 characters                                                              | Blocked before sending, draft kept, counter turns red                                                               |
| 9   | Delete a conversation                                                              | Confirm dialog → row gone, still gone after reload, toast shown                                                     |
| 10  | Exhaust the daily chat cap                                                         | One consistent number everywhere + a real reset time; the paywall matches                                           |
| 11  | Build decks until the word-list budget runs out                                    | Mimi states the real limit and reset time; never "try again in a moment"                                            |
| 12  | Open a deck page                                                                   | The `XX → YY` line reads words → definitions and has a tooltip spelling that out                                    |
| 13  | Ask "what tools do you have?"                                                      | Plain-language answer; no `create_deck` / `add_cards` / JSON                                                        |
| 14  | Make a tool fail (cap reached)                                                     | No "queued", no "will be added later"                                                                               |
| 15  | `Deck "QA-ES-PT": 5 Spanish words…`                                                | The deck is named exactly `QA-ES-PT`                                                                                |
| 16  | Enumerable request ("8 animals")                                                   | Every word in the reply matches a saved card exactly                                                                |
| 17  | Ask about deck size limits                                                         | No invented cap; up to 20 cards per request, no deck limit                                                          |
| 18  | Scroll the sidebar past 30 conversations                                           | Older chats load                                                                                                    |
| 19  | Load the site with a Ukrainian browser or from Ukraine, then open the account menu | Menu language matches the page around it — see "Locale split" below                                                 |
| 20  | Chat in Ukrainian                                                                  | «картки»/«колода»; never «карточки» or «карти»                                                                      |
| 21  | Make a first message fail                                                          | No empty "New chat" left behind                                                                                     |
| 22  | Type into the composer immediately after load                                      | Disabled until ready; nothing is swallowed                                                                          |
| 23  | "Who are you?"                                                                     | "Mimi" (the app is Mnemio)                                                                                          |
| 24  | Ask for a deck two equivalent ways                                                 | Consistent: either both build, or both ask the same question                                                        |
| 25  | Compare cards across two decks                                                     | Same style: sentence case, no trailing period, no headword restated                                                 |
| 26  | Load `/decks` with DevTools open                                                   | One `GET /decks`; no per-deck fan-out; no 404 on `billing/subscription`                                             |
| 27  | Tab to a conversation's Options button                                             | The accessible name includes the conversation title                                                                 |

---

## 3. Two findings that were not code bugs

### Deck language pairs (BUG-3, BUG-12)

The audit read the convention backwards. `targetLanguage` is the language of
`card.word` (the front) and `sourceLanguage` is the language of
`card.definition` (the back) — `docs/api-contract.md` and the deck create form
say the same. The chat tool, the deck header and the attachment card all follow
it, so QA-Fruits (`target: en`, `source: uk`, English words) was stored
correctly, and the header's `EN → UK` means words → definitions.

**Do not swap the mapping or the header.** They agree with each other; changing
one alone would break the pair.

What is real: some decks in the database have their two languages stored the
wrong way round, written by some path other than chat. To find them, from
`mnemio-backend`:

```bash
psql "$DATABASE_URL" -f scripts/sql/deck-language-audit.sql
```

It compares each deck's stored pair against the script its cards are actually
written in (Cyrillic vs Latin) and lists only the decks where the two disagree,
with `authorId`, `sourceDeckId` and `createdAt` so the originating path can be
identified. It cannot judge same-script pairs (es/pt, en/de), and it cannot tell
a genuine "learning Ukrainian from English" deck from an inverted one — its
output is a shortlist to review, never a list to apply blindly.

Then fix whichever creation path wrote them, and repair the confirmed ids with
`scripts/sql/deck-language-repair.sql` (paste the ids, read the preview, switch
`ROLLBACK` to `COMMIT`).

### Locale split between page and menu (BUG-19)

Every label in that menu already went through `t()`, so it could not be a
missing translation. The cause was the server and the client deciding the
initial locale independently: the server from a CDN country header, the client
from `navigator.language` and the time zone. Nothing persisted the server's
decision, so when the two signals disagreed the page kept the server's language
while anything rendered after hydration used the client's — and the account menu
is a teleported popover that only renders when clicked.

The server now writes its choice into the same `i18n_locale` cookie the client
reads on boot, so both sides start from one value. A saved preference still
wins, and the first-visit time-zone fallback still runs (it keys off whether the
_request_ carried a cookie, not off `document.cookie` at mount — @nuxtjs/i18n
writes that cookie itself during boot).

To retest: clear cookies, then load the site three ways — with
`cf-ipcountry: UA`, with `cf-ipcountry: US`, and with neither — and each time
open the account menu and compare it with the page around it.

## 4. Notes for the next run

- Use a dedicated test account and prefix every deck with `QA-`.
- Budget: 50 chat messages, 5 word-list decks, 20 topic decks, 10 images per
  day (free plan). `GET /ai/usage` tells you what is left before you start.
- The 48 QA conversations from the last run could not be deleted while delete
  was returning 500. They can be removed through the UI now.
