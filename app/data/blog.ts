/**
 * Cornerstone blog content. Hand-authored, typed article data — no CMS dependency.
 * Rendered by app/pages/blog.vue (index) and app/pages/blog/[slug].vue (article),
 * and enumerated for the sitemap in server/api/__sitemap__/urls.ts via BLOG_SLUGS.
 *
 * These are citation-grade, evergreen explainers (the strongest GEO / E-E-A-T surface
 * on the site). Add new entries to the top of `articles`. Keep `body` blocks simple so
 * the article template can render them without a markdown parser.
 */

export interface BlogBlock {
    type: 'h2' | 'p' | 'ul';
    /** For `h2` / `p`. */
    text?: string;
    /** For `ul`. */
    items?: string[];
}

export interface BlogArticle {
    slug: string;
    title: string;
    /** Meta description + listing excerpt. ~150 chars, citation-friendly. */
    description: string;
    /** ISO date (publish). Used for BlogPosting datePublished + sitemap lastmod. */
    date: string;
    /** Estimated read time in minutes (shown in UI). */
    readMinutes: number;
    /** Short topic label for the listing chip. */
    tag: string;
    body: BlogBlock[];
}

export const articles: BlogArticle[] = [
    {
        slug: 'what-is-spaced-repetition',
        title: 'What is spaced repetition, and why does it work?',
        description:
            'Spaced repetition schedules reviews at increasing intervals so information moves into long-term memory with the least possible study time. Here is how and why.',
        date: '2026-05-12',
        readMinutes: 6,
        tag: 'Learning science',
        body: [
            {
                type: 'p',
                text: 'Spaced repetition is a study technique in which you review material at increasing time intervals — minutes, then days, then weeks — rather than all at once. Each time you successfully recall something, the next review is pushed further into the future. The result is that you spend far less total time studying while remembering much more of what you learned.',
            },
            {
                type: 'h2',
                text: 'The forgetting curve',
            },
            {
                type: 'p',
                text: 'In the 1880s the psychologist Hermann Ebbinghaus measured how quickly he forgot newly learned information. He found that memory decays rapidly at first and then levels off — the "forgetting curve." Crucially, each time you review and successfully recall a fact, the curve flattens: you forget it more slowly than before. Spaced repetition exploits this by scheduling a review just before you would otherwise forget.',
            },
            {
                type: 'h2',
                text: 'Why spacing beats cramming',
            },
            {
                type: 'p',
                text: 'Reviewing the same material in a single long session (massed practice, or "cramming") produces strong short-term recall that fades within days. Spacing the same number of reviews across time produces durable, long-term retention. This "spacing effect" is one of the most reliable findings in the science of learning, replicated across hundreds of studies and many kinds of material.',
            },
            {
                type: 'h2',
                text: 'The role of active recall',
            },
            {
                type: 'p',
                text: 'Spaced repetition is most powerful when each review is an act of retrieval — trying to pull the answer from memory — rather than passive re-reading. The effort of recall is itself what strengthens the memory. This is why flashcards work so well: the front of the card forces a retrieval attempt before you check the back.',
            },
            {
                type: 'h2',
                text: 'How a scheduler decides when to review',
            },
            {
                type: 'p',
                text: 'A spaced-repetition system (SRS) tracks how well you recalled each card and uses that rating to set the next interval. Cards you find easy are scheduled further out; cards you struggle with come back sooner. Over time the system converges on a personalized schedule for every individual card.',
            },
            {
                type: 'ul',
                items: [
                    'Rate each review honestly — guessing inflates your intervals and hurts retention.',
                    'Short daily sessions beat occasional marathons; the schedule assumes regular reviews.',
                    'Keep cards atomic: one fact per card makes recall and scheduling far more accurate.',
                ],
            },
            {
                type: 'p',
                text: 'Mnemio applies these principles automatically: every time you study a deck, it records how you did and schedules each card for the moment it will do the most good.',
            },
        ],
    },
    {
        slug: 'how-to-make-effective-flashcards',
        title: 'How to make flashcards that actually work',
        description:
            'Great flashcards are atomic, ask for active recall, and avoid ambiguity. A practical guide to writing cards that stick — with concrete dos and don’ts.',
        date: '2026-05-26',
        readMinutes: 7,
        tag: 'How-to',
        body: [
            {
                type: 'p',
                text: 'A flashcard is only as good as the question it asks. Well-made cards make studying fast and retention high; poorly made cards waste your time and quietly teach you the wrong things. These principles come from cognitive psychology and decades of practice in the spaced-repetition community.',
            },
            {
                type: 'h2',
                text: '1. Keep each card atomic',
            },
            {
                type: 'p',
                text: 'Test one idea per card. If a card asks you to recall a list of five things, you will get it "partly right" forever and the scheduler can never settle. Break it into five cards, or use a card per item with enough context to make each unambiguous.',
            },
            {
                type: 'h2',
                text: '2. Demand active recall',
            },
            {
                type: 'p',
                text: 'The front should force you to retrieve, not recognize. "The capital of Australia is ___" is stronger than a multiple-choice prompt where the answer is visible. Cloze deletions (fill-in-the-blank) are an easy way to turn any sentence into a recall prompt.',
            },
            {
                type: 'h2',
                text: '3. Make the answer unambiguous',
            },
            {
                type: 'p',
                text: 'If a card could have several correct answers, you cannot grade yourself fairly. Add just enough context to the front so there is exactly one intended answer. Ambiguity is the most common reason a card feels "impossible."',
            },
            {
                type: 'h2',
                text: '4. Understand before you memorize',
            },
            {
                type: 'p',
                text: 'Flashcards reinforce understanding; they do not replace it. Memorizing a formula you do not understand produces brittle knowledge. Learn the concept first, then make cards to retain the pieces you need on instant recall.',
            },
            {
                type: 'h2',
                text: '5. Add images and examples',
            },
            {
                type: 'p',
                text: 'Pictures and concrete examples give memory more hooks to grab. A vocabulary card with an example sentence is far stickier than the word alone, because it encodes meaning in context.',
            },
            {
                type: 'ul',
                items: [
                    'Do: write one clear question with one clear answer.',
                    'Do: use your own words — phrasing you generated is easier to recall.',
                    'Don’t: copy long paragraphs onto a card; split them up.',
                    'Don’t: make cards for things you will never actually need to recall.',
                ],
            },
            {
                type: 'p',
                text: 'In Mnemio you can build cards by hand or have the AI generator draft a deck from a topic or your notes — then edit the cards down to atomic, unambiguous prompts before you study.',
            },
        ],
    },
    {
        slug: 'spaced-repetition-vs-cramming',
        title: 'Spaced repetition vs. cramming: which actually works?',
        description:
            'Cramming can pass tomorrow’s test but is gone within days. Spaced repetition costs less time overall and lasts for months. Here is the evidence and when each fits.',
        date: '2026-06-09',
        readMinutes: 5,
        tag: 'Learning science',
        body: [
            {
                type: 'p',
                text: 'Almost every student has crammed the night before an exam — and almost every student has forgotten most of it a week later. So how does cramming compare to spaced repetition, and is there ever a good reason to cram?',
            },
            {
                type: 'h2',
                text: 'What cramming actually does',
            },
            {
                type: 'p',
                text: 'Cramming (massed practice) packs all your study into one block. It works in the very short term: recall the next morning can be high. But because there is no spacing, the memories decay quickly. Within days, most of the material is gone — you traded long-term retention for a short-lived spike.',
            },
            {
                type: 'h2',
                text: 'What spaced repetition does differently',
            },
            {
                type: 'p',
                text: 'Spaced repetition distributes the same reviews across days and weeks. Each review happens just as the memory starts to fade, which forces effortful recall and resets the forgetting curve. The same total study time produces dramatically better retention weeks and months later.',
            },
            {
                type: 'h2',
                text: 'The evidence',
            },
            {
                type: 'p',
                text: 'The "spacing effect" — that distributed practice beats massed practice for long-term retention — is among the most robust results in cognitive psychology. It holds across vocabulary, facts, procedures, and motor skills, and across age groups. Reviews on the value of distributed practice consistently rate it as one of the highest-impact study techniques available.',
            },
            {
                type: 'h2',
                text: 'When is cramming defensible?',
            },
            {
                type: 'ul',
                items: [
                    'You only need the information for a single deadline and never again.',
                    'You have genuinely run out of time and some recall beats none.',
                    'You are doing a final light review on top of weeks of spaced study.',
                ],
            },
            {
                type: 'p',
                text: 'For anything you want to keep — a language, a professional exam, a body of knowledge — spaced repetition wins decisively, and it costs less total time. Start early, review a little each day, and let an SRS schedule the timing for you. That is exactly what Mnemio is built to do.',
            },
        ],
    },
];

export const BLOG_SLUGS: string[] = articles.map((a) => a.slug);

export const getArticle = (slug: string): BlogArticle | undefined =>
    articles.find((a) => a.slug === slug);
