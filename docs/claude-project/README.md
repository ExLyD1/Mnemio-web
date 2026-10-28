# docs/claude-project

Context pack for the **Mnemio** project in Claude Desktop (and any other
long-running AI workspace).

| File                         | Purpose                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `00-PROJECT-INSTRUCTIONS.md` | The text to paste into the project's custom instructions.                                                                     |
| `01-product-context.md`      | Product snapshot: what Mnemio is, the problem, audience, competitors, monetization, costs, unit economics, channels. No code. |
| `02-tech-context.md`         | Engineering snapshot: stack, architecture, data model, contracts, environments, gotchas, known-stale docs.                    |
| `03-notion-map.md`           | The Notion map — ten plain-language product pages, plus optional extras and the prompts that build them.                      |
| `04-what-to-upload.md`       | Which files to upload / connect / never upload, the refresh ritual, first-session checklist.                                  |

Product questions → `01`. Engineering questions → `02`. Keep them separate;
that separation is the point.

Refresh both snapshots after any sprint that changes architecture, the API,
pricing or the stack — the prompt is at the end of `04-what-to-upload.md`.
