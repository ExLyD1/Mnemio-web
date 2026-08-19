/**
 * Cornerstone blog content. Hand-authored, typed article data — no CMS dependency.
 * Rendered by app/pages/blog/index.vue (index) and app/pages/blog/[slug].vue (article),
 * and enumerated for the sitemap in server/routes/__sitemap__/urls.ts via BLOG_SLUGS.
 *
 * These are citation-grade, evergreen explainers (the strongest GEO / E-E-A-T surface
 * on the site). Each article is ONE page with content in both supported locales — the
 * page picks `translations[locale]` at render time via useAppLocale(), same as the rest
 * of the site's i18n. There is no separate URL per language; do not create one.
 *
 * Add new entries to the top of `articles`. Keep `body` blocks simple so the article
 * template can render them without a markdown parser.
 */

export interface BlogBlock {
    type: 'h2' | 'p' | 'ul';
    /** For `h2` / `p`. */
    text?: string;
    /** For `ul`. */
    items?: string[];
}

export interface BlogTranslation {
    title: string;
    /** Meta description + listing excerpt. ~150 chars, citation-friendly. */
    description: string;
    /** Short topic label for the listing chip. */
    tag: string;
    /** Estimated read time in minutes (shown in UI). */
    readMinutes: number;
    body: BlogBlock[];
}

export interface BlogArticle {
    slug: string;
    /** ISO date (publish). Used for BlogPosting datePublished + sitemap lastmod. */
    date: string;
    translations: {
        en: BlogTranslation;
        uk: BlogTranslation;
    };
}

export const articles: BlogArticle[] = [
    {
        slug: 'how-many-flashcards-per-day',
        date: '2026-08-19',
        translations: {
            en: {
                title: 'How many flashcards should you study per day?',
                description:
                    'Too many new cards a day and reviews pile up for weeks; too few and progress crawls. Here is how to pick a daily new-card limit that your review queue can actually sustain.',
                tag: 'How-to',
                readMinutes: 6,
                body: [
                    {
                        type: 'p',
                        text: 'It is tempting to add fifty new cards to a deck and start studying all of them the same day. The problem shows up about a week later: every one of those cards comes due for review at roughly the same time, on top of the next batch of new cards you added since. Daily review counts snowball, sessions get longer, and most people quit before the deck pays off. The fix is not willpower — it is picking a new-card limit your future reviews can actually absorb.',
                    },
                    {
                        type: 'h2',
                        text: 'Why "just add them all" backfires',
                    },
                    {
                        type: 'p',
                        text: "Every new card you study today generates a review in a few days, another one a week or two after that, and so on for as long as you keep the deck. Reviews compound: the more new cards you introduce this week, the larger every future day's workload becomes. A pace that feels easy on day one can produce an unmanageable queue by day thirty if you never account for the reviews still ahead of you.",
                    },
                    {
                        type: 'h2',
                        text: 'A practical starting point',
                    },
                    {
                        type: 'p',
                        text: 'For most learners, 10-20 new cards a day is a sustainable pace for a single active deck. That is enough to finish a 200-300 word vocabulary list in three to four weeks while keeping daily review sessions to 10-15 minutes. If a deck is small (under 50 cards) or you have more time to give it, you can push higher; if you are already juggling several decks, go lower rather than skipping days.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Start conservative for the first week and watch how your review count grows before increasing the limit.',
                            'If a session regularly takes longer than you are willing to spend, lower the new-card limit rather than skipping the deck entirely.',
                            'Consistency beats volume — 10 cards a day, every day, outperforms 50 cards once a week.',
                        ],
                    },
                    {
                        type: 'h2',
                        text: 'Match the pace to the deadline — or the lack of one',
                    },
                    {
                        type: 'p',
                        text: 'If you are studying for a fixed date (an exam, a trip, an interview), work backward: divide the deck size by the days remaining, leaving a buffer at the end for review-only days rather than new material. If there is no deadline — you are building a language or a body of knowledge over months — favor a lower, boring, repeatable pace. The habit matters more than the speed.',
                    },
                    {
                        type: 'h2',
                        text: 'Signs your limit is too high',
                    },
                    {
                        type: 'p',
                        text: 'Your daily review count keeps climbing week over week, sessions feel like a chore instead of a few focused minutes, or you catch yourself clicking through cards without really trying to recall the answer first. Any of these mean it is time to cut the new-card limit, not push through — a smaller sustainable pace with honest ratings will teach you more than a large one you resent.',
                    },
                    {
                        type: 'p',
                        text: "Mnemio's scheduler already spaces reviews for you based on how well you know each card — your only real lever is how many new cards you introduce each day. Set a limit you can keep up for months, not one that looks impressive for a week.",
                    },
                ],
            },
            uk: {
                title: 'Скільки флешкарток вивчати на день?',
                description:
                    'Забагато нових карток на день — і повторення накопичуються тижнями; замало — і прогрес повзе. Як обрати денний ліміт нових карток, який витримає ваша черга повторень.',
                tag: 'Практичні поради',
                readMinutes: 6,
                body: [
                    {
                        type: 'p',
                        text: "Спокуса додати одразу п'ятдесят нових карток у колоду і вивчити їх усі в один день — цілком природна. Проблема виявляється десь через тиждень: усі ці картки повертаються на повторення приблизно одночасно, ще й накладаючись на нову порцію карток, додану відтоді. Щоденна кількість повторень наростає снігом, сесії стають довшими, і більшість людей кидають колоду, так і не отримавши від неї користі. Рішення — не сила волі, а вибір денного ліміту нових карток, який ваша майбутня черга повторень реально витримає.",
                    },
                    {
                        type: 'h2',
                        text: 'Чому «додати все одразу» не працює',
                    },
                    {
                        type: 'p',
                        text: 'Кожна нова картка, яку ви вивчаєте сьогодні, породжує повторення через кілька днів, ще одне — через тиждень-два, і так далі, доки ви користуєтесь колодою. Повторення накопичуються: чим більше нових карток ви додаєте цього тижня, тим більшим стає навантаження кожного наступного дня. Темп, який здається легким першого дня, може створити непідйомну чергу вже за місяць, якщо не враховувати повторення, що чекають попереду.',
                    },
                    {
                        type: 'h2',
                        text: 'Практичний орієнтир для старту',
                    },
                    {
                        type: 'p',
                        text: 'Для більшості людей 10-20 нових карток на день — стійкий темп для однієї активної колоди. Цього достатньо, щоб опрацювати список зі 200-300 слів за три-чотири тижні, тримаючи щоденну сесію в межах 10-15 хвилин. Якщо колода невелика (до 50 карток) або у вас більше часу — можна збільшити темп; якщо ви вже ведете кілька колод одночасно, краще знизити ліміт, ніж пропускати дні.',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Почніть обережно перший тиждень і подивіться, як зростає кількість повторень, перш ніж підвищувати ліміт.',
                            'Якщо сесія регулярно займає більше часу, ніж ви готові витрачати, знижуйте ліміт нових карток, а не пропускайте колоду повністю.',
                            'Регулярність важливіша за обсяг — 10 карток щодня стабільно ефективніші за 50 карток раз на тиждень.',
                        ],
                    },
                    {
                        type: 'h2',
                        text: 'Підлаштуйте темп під дедлайн — або під його відсутність',
                    },
                    {
                        type: 'p',
                        text: 'Якщо ви готуєтесь до конкретної дати (іспиту, поїздки, співбесіди), рахуйте від кінця: поділіть розмір колоди на кількість днів, що лишились, залишивши буфер наприкінці для днів лише повторення, без нового матеріалу. Якщо дедлайну немає — ви вивчаєте мову чи здобуваєте знання роками — обирайте нижчий, буденний, повторюваний темп. Звичка важливіша за швидкість.',
                    },
                    {
                        type: 'h2',
                        text: 'Ознаки того, що ліміт завеликий',
                    },
                    {
                        type: 'p',
                        text: "Щоденна кількість повторень постійно зростає тиждень за тижнем, сесії відчуваються як обов'язок, а не кілька зосереджених хвилин, або ви ловите себе на тому, що клікаєте картки, навіть не намагаючись згадати відповідь. Будь-яка з цих ознак означає, що час знизити ліміт нових карток, а не продовжувати через силу — менший стійкий темп із чесними оцінками навчить більше, ніж великий, яким шкода признатись, що не витримуєте.",
                    },
                    {
                        type: 'p',
                        text: 'Планувальник Mnemio вже розподіляє повторення за тим, наскільки добре ви знаєте кожну картку — ваш єдиний реальний важіль впливу — це скільки нових карток ви додаєте щодня. Оберіть ліміт, який зможете тримати місяцями, а не такий, що виглядає вражаюче лише перший тиждень.',
                    },
                ],
            },
        },
    },
    {
        slug: 'how-many-words-cefr-levels',
        date: '2026-08-19',
        translations: {
            en: {
                title: 'How many words do you need to know at each CEFR level (A1–C2)?',
                description:
                    'Rough vocabulary size for CEFR levels A1–C2, why "more words" is not always "better," and how to build vocabulary efficiently.',
                tag: 'Vocabulary',
                readMinutes: 6,
                body: [
                    {
                        type: 'p',
                        text: '"How many words do I need to know to speak English fluently" sounds like a simple question, but the answer depends on which level you are aiming for. Native speakers actively use only a few thousand words in daily conversation, while passive vocabulary (words you recognize but rarely use) can be several times larger. The CEFR scale (A1–C2) gives rough ranges for each level.',
                    },
                    {
                        type: 'h2',
                        text: 'Approximate word counts by CEFR level',
                    },
                    {
                        type: 'ul',
                        items: [
                            'A1 (beginner) — roughly 500-1,000 words: basic phrases, greetings, the simplest needs.',
                            'A2 (elementary) — roughly 1,000-2,000 words: simple conversations on everyday topics.',
                            'B1 (intermediate) — roughly 2,000-3,000 words: enough for travel, work, and daily communication.',
                            'B2 (upper-intermediate) — roughly 4,000-6,000 words: comfortable discussion of abstract topics.',
                            'C1 (advanced) — roughly 8,000-10,000 words: natural, nuanced speech.',
                            'C2 (proficient) — 12,000+ words: close to an educated native speaker.',
                        ],
                    },
                    {
                        type: 'h2',
                        text: 'Why these numbers are only a rough guide',
                    },
                    {
                        type: 'p',
                        text: 'Word count is a blunt measure. Twenty well-chosen words for a specific situation — an interview, an exam — are often more useful than two hundred random ones. Likewise, the 100 most frequent English words cover roughly half of any ordinary text, so the order you learn words in matters as much as the raw count.',
                    },
                    {
                        type: 'h2',
                        text: 'What this means for exam prep',
                    },
                    {
                        type: 'p',
                        text: 'Exams built around an official vocabulary list — a specific, bounded set of words rather than "the entire B1 range" — reward targeting that exact list over trying to cover a whole CEFR band. Studying the list that will actually be tested is more efficient than studying broadly and hoping it overlaps.',
                    },
                    {
                        type: 'h2',
                        text: 'How to build vocabulary efficiently',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Learn words in context (with an example sentence), not in isolation — it sticks far better.',
                            'Use spaced repetition so a word resurfaces right before you would otherwise forget it.',
                            'Prioritize frequency lists or a specific required list over random vocabulary.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'In Mnemio you can build a deck around a specific word list — a required exam vocabulary, for example — and let the spaced-repetition scheduler work out exactly when to review each word.',
                    },
                ],
            },
            uk: {
                title: 'Скільки слів потрібно знати на кожному рівні англійської (A1–C2)?',
                description:
                    'Орієнтовна кількість слів для рівнів A1–C2 за шкалою CEFR, чому «більше слів» не завжди означає «краще», і як ефективно нарощувати словниковий запас.',
                tag: 'Словниковий запас',
                readMinutes: 6,
                body: [
                    {
                        type: 'p',
                        text: 'Питання «скільки слів треба знати, щоб вільно говорити англійською» звучить просто, але відповідь залежить від рівня, на який ви орієнтуєтесь. Носії мови активно використовують лише кілька тисяч слів у щоденному спілкуванні, тоді як пасивний словник (слова, які ви впізнаєте, але рідко вживаєте) може бути в кілька разів більшим. Шкала CEFR (A1–C2) дає орієнтовні діапазони для кожного рівня.',
                    },
                    {
                        type: 'h2',
                        text: 'Орієнтовна кількість слів за рівнями CEFR',
                    },
                    {
                        type: 'ul',
                        items: [
                            'A1 (початковий) — приблизно 500-1000 слів: базові фрази, привітання, найпростіші потреби.',
                            'A2 (елементарний) — приблизно 1000-2000 слів: прості розмови на побутові теми.',
                            'B1 (середній) — приблизно 2000-3000 слів: достатньо для подорожей, роботи, повсякденного спілкування.',
                            'B2 (вище середнього) — приблизно 4000-6000 слів: вільне обговорення абстрактних тем.',
                            'C1 (просунутий) — приблизно 8000-10000 слів: природне, нюансоване мовлення.',
                            'C2 (у досконалості) — 12000+ слів: рівень, близький до освіченого носія мови.',
                        ],
                    },
                    {
                        type: 'h2',
                        text: 'Чому ці цифри лише орієнтир',
                    },
                    {
                        type: 'p',
                        text: 'Кількість слів — грубий показник. Двадцять правильно дібраних слів для конкретної ситуації (наприклад, співбесіди чи іспиту) часто корисніші за випадкові двісті. Так само 100 найчастотніших англійських слів покривають близько половини будь-якого звичайного тексту — тому порядок вивчення має значення не менше, ніж кількість.',
                    },
                    {
                        type: 'h2',
                        text: 'Що це означає для НМТ та інших іспитів',
                    },
                    {
                        type: 'p',
                        text: 'Іспити на кшталт НМТ спираються на офіційний лексичний мінімум — конкретний, обмежений список слів, а не «весь словниковий запас рівня B1». Вивчення саме цього списку ефективніше, ніж намагання охопити весь діапазон CEFR: ви цілеспрямовано закриваєте те, що реально перевірятиметься.',
                    },
                    {
                        type: 'h2',
                        text: 'Як нарощувати словниковий запас ефективно',
                    },
                    {
                        type: 'ul',
                        items: [
                            "Вчіть слова в контексті (з прикладом речення), а не ізольовано — так вони краще запам'ятовуються.",
                            'Використовуйте інтервальне повторення (spaced repetition), щоб слово «спливало» саме тоді, коли ви ось-ось його забудете.',
                            'Пріоритизуйте частотні та тематично релевантні списки (наприклад, офіційний мінімум для іспиту) над випадковими словами.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'У Mnemio можна створити колоду під конкретний список слів — наприклад, лексичний мінімум НМТ — і дати системі інтервального повторення самій розрахувати, коли повторити кожне слово.',
                    },
                ],
            },
        },
    },
    {
        slug: 'what-is-spaced-repetition',
        date: '2026-05-12',
        translations: {
            en: {
                title: 'What is spaced repetition, and why does it work?',
                description:
                    'Spaced repetition schedules reviews at increasing intervals so information moves into long-term memory with the least possible study time. Here is how and why.',
                tag: 'Learning science',
                readMinutes: 6,
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
            uk: {
                title: 'Що таке інтервальне повторення і чому воно працює?',
                description:
                    "Інтервальне повторення планує повторення карток із дедалі більшими проміжками часу, щоб інформація закріплювалась у довготривалій пам'яті за мінімальний час навчання.",
                tag: 'Наука про навчання',
                readMinutes: 6,
                body: [
                    {
                        type: 'p',
                        text: "Інтервальне повторення (spaced repetition) — це техніка навчання, за якої ви повторюєте матеріал через дедалі більші проміжки часу — хвилини, потім дні, потім тижні — замість того, щоб вивчати все одразу. Щоразу, коли ви успішно згадуєте щось, наступне повторення відсувається далі в майбутнє. У результаті ви витрачаєте значно менше часу на навчання, запам'ятовуючи набагато більше з вивченого.",
                    },
                    {
                        type: 'h2',
                        text: 'Крива забування',
                    },
                    {
                        type: 'p',
                        text: "У 1880-х роках психолог Герман Еббінгауз вимірював, як швидко він забуває щойно вивчену інформацію. Він з'ясував, що пам'ять згасає швидко спочатку, а потім вихід на плато — так звана «крива забування». Найважливіше: щоразу, коли ви повторюєте і успішно згадуєте факт, крива вирівнюється — ви забуваєте його повільніше, ніж раніше. Інтервальне повторення використовує це, плануючи повторення саме перед тим моментом, коли ви б інакше забули.",
                    },
                    {
                        type: 'h2',
                        text: 'Чому інтервали кращі за зубріння',
                    },
                    {
                        type: 'p',
                        text: "Повторення того самого матеріалу за одну довгу сесію (масоване навчання, або «зубріння») дає сильне короткострокове запам'ятовування, яке згасає за кілька днів. Розподіл тієї ж кількості повторень у часі дає стійке, довготривале засвоєння. Цей «ефект розподілу» — один із найнадійніших результатів у науці про навчання, підтверджений сотнями досліджень на різних видах матеріалу.",
                    },
                    {
                        type: 'h2',
                        text: 'Роль активного пригадування',
                    },
                    {
                        type: 'p',
                        text: "Інтервальне повторення найефективніше, коли кожне повторення — це спроба пригадування, спроба видобути відповідь із пам'яті, а не пасивне перечитування. Саме зусилля пригадування зміцнює пам'ять. Тому флешкартки працюють так добре: лицьова сторона картки змушує спробувати згадати відповідь, перш ніж перевірити зворотну.",
                    },
                    {
                        type: 'h2',
                        text: 'Як планувальник вирішує, коли повторювати',
                    },
                    {
                        type: 'p',
                        text: 'Система інтервального повторення (SRS) відстежує, наскільки добре ви пригадали кожну картку, і використовує цю оцінку, щоб встановити наступний інтервал. Картки, які даються легко, плануються на пізніше; картки, з якими є труднощі, повертаються швидше. З часом система підлаштовує персональний графік під кожну окрему картку.',
                    },
                    {
                        type: 'ul',
                        items: [
                            "Оцінюйте кожне повторення чесно — вгадування завищує інтервали й шкодить запам'ятовуванню.",
                            'Короткі щоденні сесії кращі за поодинокі марафони — графік розрахований на регулярні повторення.',
                            'Тримайте картки атомарними: один факт на картку робить пригадування й планування набагато точнішими.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'Mnemio застосовує ці принципи автоматично: щоразу, коли ви вивчаєте колоду, система записує, як ви впорались, і планує кожну картку на момент, коли повторення принесе найбільше користі.',
                    },
                ],
            },
        },
    },
    {
        slug: 'how-to-make-effective-flashcards',
        date: '2026-05-26',
        translations: {
            en: {
                title: 'How to make flashcards that actually work',
                description:
                    'Great flashcards are atomic, ask for active recall, and avoid ambiguity. A practical guide to writing cards that stick — with concrete dos and don’ts.',
                tag: 'How-to',
                readMinutes: 7,
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
                        text: '"The capital of Australia is ___" is stronger than a multiple-choice prompt where the answer is visible. Cloze deletions (fill-in-the-blank) are an easy way to turn any sentence into a recall prompt. The front should force you to retrieve, not recognize.',
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
            uk: {
                title: 'Як створювати флешкартки, які справді працюють',
                description:
                    "Хороші флешкартки атомарні, вимагають активного пригадування й уникають двозначності. Практичний гід зі створення карток, що запам'ятовуються, — з конкретними «так» і «ні».",
                tag: 'Практичні поради',
                readMinutes: 7,
                body: [
                    {
                        type: 'p',
                        text: "Флешкартка настільки хороша, наскільки хороше питання вона ставить. Добре зроблені картки роблять навчання швидким, а запам'ятовування — міцним; погано зроблені марнують ваш час і непомітно вчать неправильного. Ці принципи походять із когнітивної психології та десятиліть практики спільноти інтервального повторення.",
                    },
                    {
                        type: 'h2',
                        text: '1. Тримайте кожну картку атомарною',
                    },
                    {
                        type: 'p',
                        text: "Перевіряйте одну ідею на картку. Якщо картка вимагає пригадати список із п'яти пунктів, ви будете «частково правими» вічно, і планувальник ніколи не зможе визначитися. Розбийте на п'ять карток або зробіть по картці на кожен пункт із достатнім контекстом, щоб кожна була однозначною.",
                    },
                    {
                        type: 'h2',
                        text: '2. Вимагайте активного пригадування',
                    },
                    {
                        type: 'p',
                        text: "Лицьова сторона повинна змушувати вас видобувати відповідь із пам'яті, а не впізнавати її. «Столиця Австралії — ___» сильніше за питання з варіантами відповідей, де правильна вже видна. Пропуски в реченні (cloze deletion) — простий спосіб перетворити будь-яке речення на завдання для пригадування.",
                    },
                    {
                        type: 'h2',
                        text: '3. Робіть відповідь однозначною',
                    },
                    {
                        type: 'p',
                        text: 'Якщо картка може мати кілька правильних відповідей, ви не зможете чесно оцінити себе. Додайте на лицьову сторону рівно стільки контексту, щоб мати одну задуману відповідь. Двозначність — найпоширеніша причина, чому картка здається «неможливою».',
                    },
                    {
                        type: 'h2',
                        text: "4. Розумійте, перш ніж запам'ятовувати",
                    },
                    {
                        type: 'p',
                        text: "Флешкартки закріплюють розуміння, а не замінюють його. Запам'ятовування формули, яку ви не розумієте, дає крихкі знання. Спочатку вивчіть концепцію, а потім робіть картки, щоб закріпити ті частини, які потрібно згадувати миттєво.",
                    },
                    {
                        type: 'h2',
                        text: '5. Додавайте зображення та приклади',
                    },
                    {
                        type: 'p',
                        text: "Картинки та конкретні приклади дають пам'яті більше «зачіпок». Картка зі словом і прикладом речення запам'ятовується набагато краще за саме лише слово, бо кодує значення в контексті.",
                    },
                    {
                        type: 'ul',
                        items: [
                            'Так: пишіть одне чітке питання з однією чіткою відповіддю.',
                            'Так: використовуйте власні слова — сформульоване вами самими легше пригадати.',
                            'Ні: не копіюйте довгі абзаци на картку — розбивайте їх.',
                            'Ні: не робіть карток для того, що вам ніколи реально не знадобиться пригадувати.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'У Mnemio можна створювати картки вручну або дати AI-генератору скласти чернетку колоди з теми чи ваших нотаток — а потім відредагувати картки до атомарних, однозначних питань перед тим, як почати вивчення.',
                    },
                ],
            },
        },
    },
    {
        slug: 'spaced-repetition-vs-cramming',
        date: '2026-06-09',
        translations: {
            en: {
                title: 'Spaced repetition vs. cramming: which actually works?',
                description:
                    'Cramming can pass tomorrow’s test but is gone within days. Spaced repetition costs less time overall and lasts for months. Here is the evidence and when each fits.',
                tag: 'Learning science',
                readMinutes: 5,
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
            uk: {
                title: 'Інтервальне повторення проти зубріння: що справді працює?',
                description:
                    'Зубріння може допомогти скласти завтрашній тест, але зникає за кілька днів. Інтервальне повторення коштує менше часу загалом і тримається місяцями. Докази й коли яке підходить.',
                tag: 'Наука про навчання',
                readMinutes: 5,
                body: [
                    {
                        type: 'p',
                        text: 'Майже кожен студент хоч раз зубрив матеріал вночі перед іспитом — і майже кожен забув більшість цього вже за тиждень. То як зубріння порівнюється з інтервальним повторенням, і чи буває взагалі виправдана причина зубрити?',
                    },
                    {
                        type: 'h2',
                        text: 'Що насправді дає зубріння',
                    },
                    {
                        type: 'p',
                        text: "Зубріння (масоване навчання) вміщує все навчання в один блок. Воно працює в дуже короткій перспективі: наступного ранку пригадування може бути високим. Але через відсутність розподілу в часі пам'ять швидко згасає. Уже за кілька днів більшість матеріалу зникає — ви обміняли довготривале засвоєння на короткий сплеск.",
                    },
                    {
                        type: 'h2',
                        text: 'Чим інтервальне повторення відрізняється',
                    },
                    {
                        type: 'p',
                        text: "Інтервальне повторення розподіляє ті самі повторення на дні й тижні. Кожне повторення відбувається саме тоді, коли пам'ять починає згасати, що змушує докладати зусиль для пригадування й «перезапускає» криву забування. Той самий загальний час навчання дає значно краще засвоєння через тижні й місяці.",
                    },
                    {
                        type: 'h2',
                        text: 'Докази',
                    },
                    {
                        type: 'p',
                        text: '«Ефект розподілу» — те, що розподілена практика перевершує масовану для довготривалого засвоєння — один із найнадійніших результатів у когнітивній психології. Він підтверджується на словниковому запасі, фактах, процедурах і моторних навичках, у різних вікових групах. Огляди цінності розподіленої практики стабільно ставлять її серед технік навчання з найбільшим ефектом.',
                    },
                    {
                        type: 'h2',
                        text: 'Коли зубріння виправдане?',
                    },
                    {
                        type: 'ul',
                        items: [
                            'Інформація потрібна лише для одного дедлайну й більше ніколи.',
                            'Часу справді не лишилось, і хоч якесь пригадування краще за жодне.',
                            'Це фінальне легке повторення поверх тижнів попереднього розподіленого навчання.',
                        ],
                    },
                    {
                        type: 'p',
                        text: 'Для всього, що ви хочете зберегти — мову, професійний іспит, певний обсяг знань — інтервальне повторення виграє переконливо, і при цьому коштує менше часу загалом. Починайте раніше, повторюйте потроху щодня, а розклад доручіть SRS. Саме для цього й побудований Mnemio.',
                    },
                ],
            },
        },
    },
];

export const BLOG_SLUGS: string[] = articles.map((a) => a.slug);

export const getArticle = (slug: string): BlogArticle | undefined =>
    articles.find((a) => a.slug === slug);
