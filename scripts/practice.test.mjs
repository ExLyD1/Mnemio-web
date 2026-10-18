import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as vue from 'vue';

const require = createRequire(import.meta.url);
const snapshot = (value) => JSON.parse(JSON.stringify(value));
const now = Date.parse('2026-10-18T12:00:00Z');
const iso = (seconds) => new Date(now + seconds * 1000).toISOString();
const previews = {
    again: { kind: 'secs', value: 60 },
    hard: { kind: 'secs', value: 600 },
    good: { kind: 'days', value: 1 },
    easy: { kind: 'days', value: 4 },
};
const card = (id, deckId = 'deck-a') => ({
    id,
    deckId,
    word: id,
    definition: `Definition ${id}`,
    type: 'basic',
    phonetic: null,
    reading: null,
    imageUrl: null,
    audioUrl: null,
});
const item = (id, state = 'new', due = null, deckId = 'deck-a') => ({
    card: card(id, deckId),
    state,
    dueAt: due,
    previews,
});
const response = (items) => ({
    items,
    counts: { new: 0, learning: 0, review: 0 },
    nextDueAt: null,
    newAvailable: 3,
    limits: { newPerDay: 20, newIntroducedToday: 0 },
});

// Execute the real composables with only their I/O boundaries replaced. No Nuxt
// app, backend, browser, or additional test dependency is required.
function load(file, mocks = {}, globals = {}) {
    const source = readFileSync(resolve(file), 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const exports = {};
    runInNewContext(
        outputText,
        {
            exports,
            require: (name) => mocks[name] ?? require(name),
            Date: class extends Date {
                static now() {
                    return now;
                }
            },
            localStorage: { getItem: () => null, setItem: () => {} },
            ...globals,
        },
        { filename: file },
    );
    return exports;
}
const asyncModule = load('app/composables/useAsync.ts', { vue });

function queueHarness(
    items,
    rate = async () => ({
        progress: { state: 'review', nextReviewAt: iso(86400) },
        requeueAt: null,
        previews: null,
    }),
) {
    const calls = [];
    const store = {
        fetchQueue: async (...args) => {
            calls.push(['queue', ...args]);
            return response(items);
        },
        rate: async (...args) => {
            calls.push(['rate', ...args]);
            return rate(...args);
        },
    };
    const module = load('app/composables/useSrsQueue.ts', {
        vue,
        '@/composables/useAsync': asyncModule,
        '@/stores/srs': { useSrsStore: () => store },
    });
    return { ...module, queue: module.useSrsQueue(), calls };
}

test('server order, due learning priority, learn-ahead, and live counts', async () => {
    const h = queueHarness(
        [item('new'), item('review', 'review'), item('future', 'learning', iso(600))],
        async (id) => ({
            progress: { state: id === 'new' ? 'learning' : 'review', nextReviewAt: iso(86400) },
            requeueAt: id === 'new' ? iso(-1) : null,
            previews: id === 'new' ? previews : null,
        }),
    );
    await h.queue.load('deck-a', 20);
    assert.deepEqual(snapshot(h.calls[0]), ['queue', 'deck-a', 20]);
    assert.equal(h.queue.current.value.card.id, 'new');
    assert.deepEqual(snapshot(h.queue.counts.value), { new: 1, learning: 1, review: 1 });
    await h.queue.submit('again');
    assert.equal(h.queue.current.value.card.id, 'new');
    assert.deepEqual(snapshot(h.queue.current.value.previews), previews);
});

test('future learning follows reviews and returns immediately within 20 minutes', async () => {
    const h = queueHarness([item('one'), item('two', 'review')], async (id, _deck, rating) => ({
        progress: { state: rating === 'again' ? 'learning' : 'review', nextReviewAt: iso(86400) },
        requeueAt: id === 'one' && rating === 'again' ? iso(60) : null,
        previews: id === 'one' && rating === 'again' ? previews : null,
    }));
    await h.queue.load();
    await h.queue.submit('again');
    assert.equal(h.queue.current.value.card.id, 'two');
    await h.queue.submit('good');
    assert.equal(h.queue.current.value.card.id, 'one');
    await h.queue.submit('easy');
    assert.equal(h.queue.current.value, null);
    assert.deepEqual(snapshot(h.queue.counts.value), { new: 0, learning: 0, review: 0 });
    assert.equal(h.queue.nextDueAt.value, iso(86400));
});

test('learning beyond 20 minutes ends the queue and exposes its next due time', async () => {
    const h = queueHarness([item('one')], async () => ({
        progress: { state: 'learning', nextReviewAt: iso(1260) },
        requeueAt: iso(1260),
        previews,
    }));
    await h.queue.load();
    await h.queue.submit('hard');
    assert.equal(h.queue.current.value, null);
    assert.equal(h.queue.nextDueAt.value, iso(1260));
});

test('failed ratings retain the card and previews; concurrent ratings are ignored', async () => {
    let rejectRate;
    const h = queueHarness(
        [item('one')],
        () =>
            new Promise((_, reject) => {
                rejectRate = reject;
            }),
    );
    await h.queue.load();
    const pending = h.queue.submit('again');
    assert.equal(await h.queue.submit('easy'), false);
    rejectRate({ code: 'NETWORK_ERROR', message: 'offline' });
    assert.equal(await pending, false);
    assert.equal(h.queue.current.value.card.id, 'one');
    assert.deepEqual(snapshot(h.queue.current.value.previews), previews);
    assert.equal(h.calls.filter(([name]) => name === 'rate').length, 1);
});

function practiceHarness(mode, cards, rate) {
    const h = queueHarness(
        cards.map((c) => ({ card: c, state: 'review', dueAt: iso(-1), previews })),
        rate,
    );
    const calls = [];
    const sessions = {
        active: null,
        latestIncomplete: null,
        start: async (input) => {
            calls.push(['start', snapshot(input)]);
            sessions.active = { id: 'session', ...input };
            return sessions.active;
        },
        updateActive: async (patch) => {
            calls.push(['update', snapshot(patch)]);
            return sessions.active;
        },
        complete: async () => {
            calls.push(['complete']);
            const ended = sessions.active;
            sessions.active = null;
            return ended;
        },
        exit: async () => {
            calls.push(['exit']);
            sessions.active = null;
        },
        resume: async () => sessions.active,
    };
    const deck = vue.reactive({ deck: { id: 'deck-a', title: 'Test deck', cards } });
    const practiceModule = load('app/composables/useQueuePractice.ts', {
        vue,
        '@vueuse/core': { useIntervalFn: () => ({ pause() {}, resume() {} }) },
        '@/composables/useSrsQueue': { useSrsQueue: h.useSrsQueue },
        '@/composables/useAsync': asyncModule,
        '@/composables/useDecks': {
            useDecks: () => ({
                store: deck,
                fetchOne: asyncModule.useAsync(async () => deck.deck),
            }),
        },
        '@/stores/sessions': { useSessionsStore: () => sessions },
        '@/stores/practice': {
            usePracticeStore: () => ({
                setResult: (result) => calls.push(['result', snapshot(result)]),
            }),
        },
        '@/composables/useApiError': { useApiError: () => ({ apiErrorText: () => 'error' }) },
        '@/composables/useToast': { useToast: () => ({ error: () => calls.push(['toast']) }) },
        '@/composables/useAnalytics': { useAnalytics: () => ({ track() {} }) },
    });
    return {
        ...h,
        calls,
        apiCalls: h.calls,
        practice: practiceModule.useQueuePractice({ deckId: 'deck-a', mode, format: 'flashcard' }),
    };
}

test('Know mode drills the whole deck in unknown-only rounds without rating SRS', async () => {
    const h = practiceHarness('know', [card('a'), card('b')]);
    await h.practice.initialize();
    assert.equal(h.practice.trackProgress.value, true);
    const unknownId = h.practice.current.value.id;
    await h.practice.submit('again');
    await h.practice.submit('good');
    assert.equal(h.practice.roundDone.value, true);
    assert.equal(h.practice.finished.value, false);
    h.practice.nextRound();
    assert.equal(h.practice.current.value.id, unknownId);
    await h.practice.submit('good');
    assert.equal(h.practice.finished.value, true);
    assert.equal(h.practice.answers.value, 3);
    assert.equal(h.apiCalls.length, 0);
    assert.equal(
        h.calls
            .filter(([name]) => name === 'start')
            .every(([, input]) => input.srsEnabled === false),
        true,
    );
    assert.equal(h.calls.filter(([name]) => name === 'result').at(-1)[1].correct, 2);
});

test('Anki Hard is a pass and repeated answers persist beyond the initial queue length', async () => {
    let attempts = 0;
    const h = practiceHarness('srs', [card('a')], async () => ({
        progress: { state: ++attempts === 1 ? 'learning' : 'review', nextReviewAt: iso(86400) },
        requeueAt: attempts === 1 ? iso(600) : null,
        previews: attempts === 1 ? previews : null,
    }));
    await h.practice.initialize();
    await h.practice.submit('hard');
    assert.equal(h.practice.current.value.id, 'a');
    await h.practice.submit('good');
    assert.equal(h.practice.finished.value, true);
    const lastPatch = h.calls.filter(([name]) => name === 'update').at(-1)[1];
    assert.equal(lastPatch.index, 2);
    assert.equal(lastPatch.correct, 2);
    assert.deepEqual(h.calls.find(([name]) => name === 'start')[1].cardIds, ['a']);
});

test('a failed SRS request changes neither answers nor stats and can be retried', async () => {
    let fail = true;
    const h = practiceHarness('srs', [card('a')], async () => {
        if (fail) throw { code: 'NETWORK_ERROR', message: 'offline' };
        return {
            progress: { state: 'review', nextReviewAt: iso(86400) },
            requeueAt: null,
            previews: null,
        };
    });
    await h.practice.initialize();
    await h.practice.submit('again');
    assert.equal(h.practice.answers.value, 0);
    assert.equal(h.practice.current.value.id, 'a');
    assert.equal(
        h.calls.some(([name]) => name === 'update'),
        false,
    );
    fail = false;
    await h.practice.submit('good');
    assert.equal(h.practice.finished.value, true);
});

test('interval formatting covers boundaries, fractional months/years, and Ukrainian units', () => {
    const { formatSrsInterval } = load('app/utils/srsInterval.ts');
    const en = { minute: 'm', hour: 'h', day: 'd', month: 'mo', year: 'y' };
    const t = (key) => en[key.split('.').at(-1)];
    for (const [kind, value, expected] of [
        ['secs', 30, '<1m'],
        ['secs', 60, '1m'],
        ['secs', 600, '10m'],
        ['secs', 3600, '1h'],
        ['days', 1, '1d'],
        ['days', 4, '4d'],
        ['days', 30, '1mo'],
        ['days', 45, '1.5mo'],
        ['days', 730, '2y'],
    ])
        assert.equal(formatSrsInterval({ kind, value }, t), expected);
    assert.equal(
        formatSrsInterval({ kind: 'secs', value: 600 }, () => 'хв'),
        '10хв',
    );
});

test('queue/rate API leaves the timezone to the X-Timezone header and APKG sends front/back languages as multipart', async () => {
    const calls = [];
    const http = async (...args) => {
        calls.push(args);
        return { newAchievements: [] };
    };
    const srs = load('app/api/srs.ts', {
        '@/utils/http': { http, clientTimeZone: () => 'Europe/Kyiv' },
    });
    await srs.getQueue('deck-a', 20);
    await srs.rateCard('card-a', 'deck-a', 'hard');
    assert.deepEqual(snapshot(calls[0]), [
        '/srs/queue',
        { query: { deckId: 'deck-a', extraNew: 20 } },
    ]);
    assert.deepEqual(snapshot(calls[1]), [
        '/srs/rate',
        { method: 'POST', body: { cardId: 'card-a', rating: 'hard' } },
    ]);
    const imports = load('app/api/imports.ts', { '@/utils/http': { http } }, { FormData });
    const file = new File(['package'], 'deck.apkg');
    await imports.importApkg(file, 'uk', 'ja');
    const [path, options] = calls[2];
    assert.equal(path, '/imports/apkg');
    assert.equal(options.body.get('file').name, 'deck.apkg');
    assert.equal(options.body.get('sourceLanguage'), 'uk');
    assert.equal(options.body.get('targetLanguage'), 'ja');
});

test('card text validation matches the backend boundaries', () => {
    const { cardSchema } = load('app/schemas/card.ts');
    const data = { word: 'w'.repeat(500), definition: 'd'.repeat(2000) };
    assert.equal(cardSchema.safeParse(data).success, true);
    assert.equal(cardSchema.safeParse({ ...data, word: `${data.word}w` }).success, false);
    assert.equal(
        cardSchema.safeParse({ ...data, definition: `${data.definition}d` }).success,
        false,
    );
});
