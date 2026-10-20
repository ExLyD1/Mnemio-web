import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as vue from 'vue';

const require = createRequire(import.meta.url);
function load(file, mocks, globals = {}) {
    const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const exports = {};
    runInNewContext(
        outputText,
        {
            exports,
            require: (name) => mocks[name] ?? require(name),
            AbortController,
            AbortSignal,
            URL,
            FormData,
            TextDecoder,
            Response,
            setTimeout,
            clearTimeout,
            localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
            ...globals,
        },
        { filename: file },
    );
    return exports;
}
const conv = (id) => ({ id, title: id, lastMessageAt: new Date().toISOString() });
const user = (id = 'user') => ({ id, role: 'user', content: 'hello', status: 'complete' });
const assistant = (id = 'assistant', status = 'partial') => ({
    id,
    role: 'assistant',
    content: '',
    status,
});
const deferred = () => {
    let resolve;
    const promise = new Promise((r) => {
        resolve = r;
    });
    return { promise, resolve };
};

test('pending reply covers send setup, first token, tool execution and completion', async () => {
    const waiting = deferred();
    let callbacks;
    const { chat } = harness({
        streamMessage: async (_id, _text, handlers) => {
            handlers.onStart({ userMessage: user(), assistantMessageId: 'answer' });
            callbacks = handlers;
            await waiting.promise;
        },
    });
    chat.initialized.value = true;
    assert.equal(chat.pendingReply.value, false);
    const sending = chat.send('hello');
    assert.equal(chat.pendingReply.value, true);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(chat.pendingReply.value, true);
    callbacks.onToken('Hello');
    assert.equal(chat.pendingReply.value, false);
    callbacks.onToolUse({ name: 'create_deck', input: {} });
    assert.equal(chat.pendingReply.value, true);
    callbacks.onToolResult({ name: 'create_deck', ok: false });
    assert.equal(chat.pendingReply.value, true);
    callbacks.onToken('Sorry');
    assert.equal(chat.pendingReply.value, false);
    waiting.resolve();
    await sending;
    assert.equal(chat.pendingReply.value, false);
});
function harness(overrides = {}) {
    let hooks;
    let cleanup;
    const api = {
        listConversations: async () => ({ items: [], nextCursor: null }),
        createConversation: async () => conv('new'),
        deleteConversation: async () => {},
        cancelReply: async () => {},
        getAiUsage: async () => null,
        getConversation: async () => ({ messages: [] }),
        streamMessage: async (_id, _text, handlers) => {
            hooks = handlers;
        },
        ...overrides,
    };
    const { useChat } = load('app/composables/useChat.ts', {
        '#imports': {
            ...vue,
            useI18n: () => ({ locale: vue.ref('en') }),
            onBeforeUnmount: (fn) => {
                cleanup = fn;
            },
        },
        '@/api/chat': api,
    });
    return { chat: useChat(), api, hooks: () => hooks, cleanup: () => cleanup() };
}

test('earlier pages prepend once, handle errors, and stop at the last page', async () => {
    let calls = 0;
    const { chat } = harness({
        getConversation: async (_id, before) => {
            calls++;
            if (!before) return { messages: [user('new')], hasMore: true, before: 'cursor' };
            assert.equal(before, 'cursor');
            return { messages: [user('old'), user('new')], hasMore: false, before: null };
        },
    });
    await chat.openConversation('c');
    await Promise.all([chat.loadEarlierMessages(), chat.loadEarlierMessages()]);
    assert.deepEqual(
        Array.from(chat.messages.value, (m) => m.id),
        ['old', 'new'],
    );
    assert.equal(chat.earlierCursor.value, null);
    await chat.loadEarlierMessages();
    assert.equal(calls, 2);
});

test('earlier-page failures can be retried and a stale page cannot change another chat', async () => {
    const wait = deferred();
    let fail = true;
    const { chat } = harness({
        getConversation: async (_id, before) => {
            if (!before) return { messages: [user(_id)], hasMore: true, before: 'cursor' };
            if (fail) {
                fail = false;
                throw new Error('offline');
            }
            return wait.promise;
        },
    });
    await chat.openConversation('a');
    await chat.loadEarlierMessages();
    assert.equal(chat.earlierError.value, true);
    assert.equal(chat.earlierCursor.value, 'cursor');
    const pending = chat.loadEarlierMessages();
    await chat.openConversation('b');
    wait.resolve({ messages: [user('old-a')], hasMore: false, before: null });
    await pending;
    assert.deepEqual(
        Array.from(chat.messages.value, (m) => m.id),
        ['b'],
    );
    assert.equal(chat.loadingEarlier.value, false);
});

test('Ukrainian plural rule selects one/few/many and English selects singular', () => {
    const { ukPluralRule } = load('app/i18n/plurals.ts', {});
    const forms = ['картка', 'картки', 'карток'];
    for (const [n, expected] of [
        [1, 'картка'],
        [2, 'картки'],
        [5, 'карток'],
        [11, 'карток'],
        [21, 'картка'],
        [22, 'картки'],
        [25, 'карток'],
    ]) {
        assert.equal(forms[ukPluralRule(n)], expected);
    }
    const { createI18n } = require('vue-i18n');
    const en = JSON.parse(readFileSync('app/i18n/en.json', 'utf8'));
    const uk = JSON.parse(readFileSync('app/i18n/uk.json', 'utf8'));
    const i18n = createI18n({
        legacy: false,
        locale: 'uk',
        pluralRules: { uk: ukPluralRule },
        messages: { en, uk },
    });
    assert.equal(i18n.global.t('deck.cardCount', { n: 2 }, 2), '2 картки');
    i18n.global.locale.value = 'en';
    assert.equal(i18n.global.t('deck.cardCount', { n: 1 }, 1), '1 card');
    assert.equal(i18n.global.t('deck.cardCount', { n: 2 }, 2), '2 cards');
});

test('failed conversation creation releases sending state and signals draft restoration', async () => {
    const { chat } = harness({
        createConversation: async () => {
            throw { code: 'NETWORK_ERROR' };
        },
    });
    assert.equal(await chat.send('hello'), false);
    assert.equal(chat.streaming.value, false);
    assert.equal(chat.messages.value.length, 0);
});
test('transport failure before start signals draft restoration', async () => {
    const { chat } = harness({
        streamMessage: async (_id, _text, h) => h.onError({ code: 'NETWORK_ERROR' }),
    });
    assert.equal(await chat.send('hello'), false);
    assert.equal(chat.messages.value.length, 0);
});
test('double send while creating a conversation creates only one turn', async () => {
    const wait = deferred();
    let creates = 0;
    const { chat } = harness({
        createConversation: async () => {
            creates++;
            await wait.promise;
            return conv('new');
        },
    });
    const first = chat.send('hello');
    await chat.send('hello');
    wait.resolve();
    await first;
    assert.equal(creates, 1);
    assert.equal(chat.messages.value.length, 2);
});
test('partial reply keeps server id and can be retried immediately', async () => {
    const { chat } = harness({
        streamMessage: async (_id, _text, h) => {
            h.onStart({ userMessage: user(), assistantMessageId: 'real-id' });
            h.onToken('half');
            h.onError({ code: 'AI_PROVIDER_ERROR' });
        },
    });
    await chat.send('hello');
    assert.equal(chat.messages.value.at(-1).id, 'real-id');
    assert.equal(chat.canRetry(chat.messages.value.at(-1)), true);
});
test('tool result stays attached if the following stream fails', async () => {
    const { chat } = harness({
        streamMessage: async (_id, _text, h) => {
            h.onStart({ userMessage: user(), assistantMessageId: 'real-id' });
            h.onToolResult({ ok: true, data: { type: 'deck', deckId: 'saved' } });
            h.onError({ code: 'NETWORK_ERROR' });
        },
    });
    await chat.send('hello');
    assert.equal(chat.messages.value.at(-1).attachments[0].deckId, 'saved');
    assert.equal(chat.canRetry(chat.messages.value.at(-1)), false);
});
test('only the latest partial reply is retryable', () => {
    const { chat } = harness();
    const a = assistant();
    chat.messages.value = [user(), a, user('later')];
    assert.equal(chat.canRetry(a), false);
});
test('late stream callbacks and finalizer cannot affect a new thread', async () => {
    const wait = deferred();
    let h;
    const { chat } = harness({
        streamMessage: async (_id, _text, handlers) => {
            h = handlers;
            await wait.promise;
        },
    });
    const first = chat.send('hello');
    await new Promise(setImmediate);
    chat.newConversation();
    chat.streaming.value = true;
    h.onError({ code: 'NETWORK_ERROR' });
    h.onToken('stale');
    wait.resolve();
    await first;
    assert.equal(chat.streamError.value, null);
    assert.equal(chat.streaming.value, true);
    assert.equal(chat.messages.value.length, 0);
});
test('new chat unlocks composer even during a slow thread load', async () => {
    const wait = deferred();
    const { chat } = harness({
        getConversation: async () => {
            await wait.promise;
            return { messages: [user()] };
        },
    });
    await chat.loadConversations();
    const opening = chat.openConversation('old');
    chat.newConversation();
    assert.equal(chat.canSend.value, true);
    wait.resolve();
    await opening;
    assert.equal(chat.messages.value.length, 0);
});
test('stop aborts live request and leaves a partial reply', async () => {
    const { chat } = harness({
        streamMessage: async (_id, _text, h, signal) => {
            h.onStart({ userMessage: user(), assistantMessageId: 'real-id' });
            h.onToken('half');
            await new Promise((resolve) =>
                signal.addEventListener('abort', resolve, { once: true }),
            );
        },
    });
    const sending = chat.send('hello');
    await new Promise(setImmediate);
    chat.stop();
    await sending;
    assert.equal(chat.streaming.value, false);
    assert.equal(chat.messages.value.at(-1).status, 'partial');
});
test('unmount aborts requests and ignores late callbacks', async () => {
    const wait = deferred();
    let signal;
    const h = harness({
        streamMessage: async (_id, _text, _h, s) => {
            signal = s;
            await wait.promise;
        },
    });
    const sending = h.chat.send('hello');
    await new Promise(setImmediate);
    h.cleanup();
    assert.equal(signal.aborted, true);
    wait.resolve();
    await sending;
});
test('oversize input makes no conversation and keeps sending unlocked', async () => {
    let called = false;
    const { chat } = harness({
        createConversation: async () => {
            called = true;
        },
    });
    await chat.send('a'.repeat(4001));
    assert.equal(called, false);
    assert.equal(chat.streaming.value, false);
});

function sseHarness(chunks, fetchOverride) {
    const errors = [];
    const frames = [];
    const { runSse } = load(
        'app/utils/sse.ts',
        {
            '@/utils/http': {
                clientTimeZone: () => null,
                getApiBase: () => '',
                refreshAccessToken: async () => ({ token: null, wasInvalid: false }),
            },
            '@/utils/authToken': { readAccessToken: () => 'test' },
        },
        {
            fetch:
                fetchOverride ??
                (async () =>
                    new Response(
                        new ReadableStream({
                            start(c) {
                                for (const chunk of chunks)
                                    c.enqueue(new TextEncoder().encode(chunk));
                                c.close();
                            },
                        }),
                    )),
        },
    );
    return {
        errors,
        frames,
        run: () =>
            runSse({
                path: '/chat/test',
                body: {},
                onFrame: (f) => frames.push(f),
                onError: (e) => errors.push(e),
            }),
    };
}
test('EOF without done becomes a recoverable interruption', async () => {
    const h = sseHarness(['event: token\ndata: {"delta":"half"}\n\n']);
    await h.run();
    assert.equal(h.errors[0].code, 'NETWORK_ERROR');
});
test('CRLF frame separators work even across network chunks', async () => {
    const h = sseHarness(['event: done\r', '\ndata: {}\r\n\r', '\n']);
    await h.run();
    assert.equal(h.frames[0].event, 'done');
    assert.equal(h.errors.length, 0);
});
test('error frame does not produce a second transport error', async () => {
    const h = sseHarness(['event: error\ndata: {"code":"AI_PROVIDER_ERROR"}\n\n']);
    await h.run();
    assert.equal(h.frames.length, 1);
    assert.equal(h.errors.length, 0);
});
test('network failure before headers is friendly', async () => {
    const h = sseHarness([], async () => {
        throw new TypeError('fetch failed');
    });
    await h.run();
    assert.equal(h.errors[0].code, 'NETWORK_ERROR');
});
test('HTTP 429 preserves the error code and cap details', async () => {
    const h = sseHarness(
        [],
        async () =>
            new Response(
                JSON.stringify({ code: 'AI_BUDGET_EXCEEDED', details: { capPerDay: 12 } }),
                { status: 429 },
            ),
    );
    await h.run();
    assert.equal(h.errors[0].details.capPerDay, 12);
});

test('failed retry before start keeps the original failed pair', async () => {
    const { chat } = harness({
        streamMessage: async (_id, _text, h) => h.onError({ code: 'NETWORK_ERROR' }),
    });
    chat.activeId.value = 'existing';
    chat.messages.value = [user(), assistant()];
    await chat.retry('assistant');
    assert.deepEqual(
        Array.from(chat.messages.value, (m) => m.id),
        ['user', 'assistant'],
    );
});
test('stop before stream start keeps unsent text recoverable', async () => {
    const { chat } = harness({
        streamMessage: async (_id, _text, _h, signal) => {
            await new Promise((resolve) =>
                signal.addEventListener('abort', resolve, { once: true }),
            );
        },
    });
    const sending = chat.send('unsent');
    await new Promise(setImmediate);
    chat.stop();
    assert.equal(await sending, false);
    assert.equal(chat.messages.value.length, 0);
});

test('confirmed expired session restores the send as failed and navigates with cleared auth state', async () => {
    const errors = [];
    let target;
    const { runSse } = load(
        'app/utils/sse.ts',
        {
            '@/utils/http': {
                clientTimeZone: () => null,
                getApiBase: () => '',
                refreshAccessToken: async () => ({ token: null, wasInvalid: true }),
            },
            '@/utils/authToken': { readAccessToken: () => 'expired' },
        },
        {
            fetch: async () => new Response('{}', { status: 401 }),
            window: {
                location: {
                    assign: (url) => {
                        target = url;
                    },
                },
            },
        },
    );
    await runSse({
        path: '/chat/test',
        body: {},
        onFrame: () => {},
        onError: (e) => errors.push(e),
    });
    assert.equal(target, '/login?reason=session_expired');
    assert.equal(errors[0].code, 'AUTH_INVALID_REFRESH');
});

test('failed cancellation cannot set an error in a different conversation', async () => {
    let reject;
    const pending = new Promise((_resolve, fail) => {
        reject = fail;
    });
    const { chat } = harness({ cancelReply: () => pending });
    chat.activeId.value = 'old';
    chat.stop();
    chat.newConversation();
    reject(new Error('offline'));
    await new Promise(setImmediate);
    assert.equal(chat.streamError.value, null);
});

// Run the actual page handlers with their UI and I/O boundaries replaced.
function pageHandlers(names, globals) {
    const page = readFileSync('app/pages/ai.vue', 'utf8');
    const script = page.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1];
    const source = ts.createSourceFile('ai.vue.ts', script, ts.ScriptTarget.Latest, true);
    const selected = source.statements.filter(
        (statement) =>
            ts.isVariableStatement(statement) &&
            statement.declarationList.declarations.some((declaration) =>
                names.includes(declaration.name.getText(source)),
            ),
    );
    assert.equal(selected.length, names.length);
    const { outputText } = ts.transpileModule(
        selected.map((statement) => statement.getText(source)).join('\n') +
            '\nexport { ' +
            names.join(', ') +
            ' };',
        { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
    );
    const exports = {};
    runInNewContext(outputText, { exports, ...globals });
    return exports;
}

test('sending from old messages follows the answer and restores a rejected draft', async () => {
    const actions = [];
    const draft = vue.ref('keep these words');
    const { onSend } = pageHandlers(['onSend'], {
        draft,
        attachedImage: vue.ref(null),
        attachedPreview: vue.ref(null),
        MAX_MESSAGE_CHARS: 4000,
        saveDraft: (text) => actions.push(['save', text]),
        jumpToBottom: () => actions.push(['follow']),
        resetInput: () => {
            draft.value = '';
        },
        chat: {
            canSend: vue.ref(true),
            send: async (text) => {
                actions.push(['send', text]);
                return false;
            },
        },
        nextTick: (fn) => fn(),
        autoGrow: () => {},
    });
    await onSend();
    assert.deepEqual(actions, [
        ['save', 'keep these words'],
        ['follow'],
        ['send', 'keep these words'],
    ]);
    assert.equal(draft.value, 'keep these words');
});

test('retry follows the reply and returns focus after completion', async () => {
    const actions = [];
    const { onRetry } = pageHandlers(['onRetry'], {
        jumpToBottom: () => actions.push('follow'),
        chat: { retry: async (id) => actions.push(id) },
        inputEl: vue.ref({ focus: () => actions.push('focus') }),
    });
    await onRetry('failed-reply');
    assert.deepEqual(actions, ['follow', 'failed-reply', 'focus']);
});

test('IME and Shift+Enter keep editing while plain Enter sends', () => {
    let sent = 0;
    let prevented = 0;
    const { onEnterKey } = pageHandlers(['onEnterKey'], { onSend: () => sent++ });
    const event = { preventDefault: () => prevented++ };
    onEnterKey({ ...event, isComposing: true });
    onEnterKey({ ...event, keyCode: 229 });
    onEnterKey({ ...event, shiftKey: true });
    assert.equal(sent, 0);
    assert.equal(prevented, 0);
    onEnterKey(event);
    assert.equal(sent, 1);
    assert.equal(prevented, 1);
});

test('unsent drafts are scoped to their owner and cleared after acceptance', () => {
    const stored = new Map();
    const auth = { currentUser: { id: 'user-a' } };
    const { saveDraft } = pageHandlers(['draftKey', 'saveDraft'], {
        auth,
        sessionStorage: {
            setItem: (key, value) => stored.set(key, value),
            removeItem: (key) => stored.delete(key),
        },
    });
    saveDraft('private draft');
    auth.currentUser = { id: 'user-b' };
    saveDraft('another draft');
    saveDraft('');
    assert.deepEqual([...stored], [['mnemio.chat.draft.user-a', 'private draft']]);
});
