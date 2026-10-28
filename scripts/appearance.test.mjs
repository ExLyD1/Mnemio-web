import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as vue from 'vue';

const require = createRequire(import.meta.url);
const load = (file, imports = {}, globals = {}) => {
    const source = readFileSync(file, 'utf8').replaceAll('import.meta.client', 'true');
    const code = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const exports = {};
    runInNewContext(code, {
        exports,
        require: (name) => imports[name] ?? require(name),
        ...globals,
    });
    return exports;
};
const logic = load('app/utils/appearance.ts');
const snapshot = (value) => JSON.parse(JSON.stringify(value));
const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
};

const setup = ({ stored = '{}', cookies = {}, locale = 'en' } = {}) => {
    const storage = new Map([['mnemio-appearance', stored]]);
    const classes = new Set(['dark']);
    const patches = [];
    const events = [];
    const errors = [];
    const pending = [];
    const cookieRefs = Object.fromEntries(
        Object.entries(cookies).map(([key, value]) => [key, vue.ref(value)]),
    );
    const imports = {
        '#imports': {
            ...vue,
            defineStore: (_id, factory) => factory,
            useCookie: (key) => (cookieRefs[key] ??= vue.ref()),
            useNuxtApp: () => ({ $i18n: { locale: vue.ref(locale) } }),
        },
        '@/utils/appearance': logic,
        '@/i18n/en.json': require('../app/i18n/en.json'),
        '@/i18n/uk.json': require('../app/i18n/uk.json'),
        '@/api/preferences': {
            updatePreferences: (patch) => {
                patches.push(snapshot(patch));
                const request = deferred();
                pending.push(request);
                return request.promise;
            },
        },
        '@/composables/useAnalytics': {
            useAnalytics: () => ({ track: (...args) => events.push(snapshot(args)) }),
        },
        '@/composables/useToast': {
            useToast: () => ({ error: (message) => errors.push(message) }),
        },
    };
    const globals = {
        document: {
            documentElement: {
                classList: {
                    add: (...values) => values.forEach((value) => classes.add(value)),
                    remove: (...values) => values.forEach((value) => classes.delete(value)),
                },
            },
        },
        localStorage: {
            getItem: (key) => storage.get(key),
            setItem: (key, value) => storage.set(key, value),
        },
    };
    const scope = vue.effectScope();
    const store = scope.run(() =>
        load('app/stores/appearance.ts', imports, globals).useAppearanceStore(),
    );
    return { store, scope, patches, events, errors, pending, classes, storage, cookieRefs };
};

test('every mood resolves to the approved pose, with surprised fallback only for pandas', () => {
    assert.deepEqual(snapshot(logic.MOOD_POSE), {
        idle: 'neutral',
        good: 'wave',
        easy: 'cheer',
        streak: 'cheer',
        done: 'cheer',
        hard: 'point',
        forgot: 'sleepy',
    });
    for (const mascot of logic.MASCOTS) {
        assert.equal(
            logic.mimiSource(mascot, 'surprised'),
            `/images/mimi/${mascot}/${mascot === 'axolotl' ? 'surprised' : 'point'}.svg`,
        );
        for (const pose of [
            'neutral',
            'wave',
            'cheer',
            'point',
            'sleepy',
            'flashcard',
            'peek',
            'peek-paws',
        ]) {
            assert.ok(existsSync(`public${logic.mimiSource(mascot, pose)}`));
        }
    }
});

test('before-paint script respects cookie precedence and preserves color-mode classes', () => {
    for (const [cookie, local, expected] of [
        ['mnemio-palette=violet', '{"palette":"pink"}', 'pal-violet'],
        ['other=1; mnemio-palette=pink', '{}', 'pal-pink'],
        ['mnemio-palette=green', '{"palette":"pink"}', null],
        ['', '{"palette":"violet"}', 'pal-violet'],
        ['mnemio-palette=%invalid', '{}', null],
        ['', 'invalid', null],
        ['mnemio-palette=invalid', '{}', null],
    ]) {
        const classes = new Set(['light']);
        runInNewContext(logic.APPEARANCE_INIT_SCRIPT, {
            document: {
                cookie,
                documentElement: {
                    classList: {
                        add: (key) => classes.add(key),
                        remove: (...keys) => keys.forEach((key) => classes.delete(key)),
                    },
                },
            },
            localStorage: { getItem: () => local },
        });
        assert.deepEqual([...classes], expected ? ['light', expected] : ['light']);
    }
});

test('server hydration wins over local, mirrors cookies/storage, and reset restores defaults', () => {
    const ctx = setup({
        stored: '{"mascot":"pink","palette":"pink"}',
        cookies: { 'mnemio-palette': 'violet' },
    });
    assert.equal(ctx.store.mascot.value, 'pink');
    assert.equal(ctx.store.palette.value, 'violet');
    ctx.store.hydrate({ mascot: 'red', palette: 'green' });
    assert.deepEqual(JSON.parse(ctx.storage.get('mnemio-appearance')), {
        mascot: 'red',
        palette: 'green',
    });
    assert.equal(ctx.cookieRefs['mnemio-mascot'].value, 'red');
    assert.deepEqual([...ctx.classes], ['dark']);
    ctx.store.reset();
    assert.equal(ctx.store.mascot.value, 'panda');
    assert.equal(ctx.store.palette.value, 'green');
    ctx.scope.stop();
});

test('invalid local values and legacy preference responses fall back to defaults', () => {
    const ctx = setup({ stored: '{"mascot":"invalid","palette":"invalid"}' });
    ctx.store.hydrate({});
    assert.equal(ctx.store.mascot.value, 'panda');
    assert.equal(ctx.store.palette.value, 'green');
    ctx.scope.stop();
});

test('changes are immediate, PATCH only their preference field, and track only after success', async () => {
    const ctx = setup();
    const save = ctx.store.setPalette('violet');
    assert.equal(ctx.store.palette.value, 'violet');
    assert.ok(ctx.classes.has('pal-violet'));
    assert.equal(ctx.events.length, 0);
    await Promise.resolve();
    assert.deepEqual(ctx.patches, [{ palette: 'violet' }]);
    ctx.pending[0].resolve({});
    await save;
    assert.deepEqual(ctx.events, [['appearance_changed', { setting: 'palette', value: 'violet' }]]);
    ctx.scope.stop();
});

test('failed save rolls back state, cookie, storage and html class and shows the save error', async () => {
    const ctx = setup();
    const save = ctx.store.setPalette('pink');
    await Promise.resolve();
    ctx.pending[0].reject(new Error('offline'));
    await save;
    assert.equal(ctx.store.palette.value, 'green');
    assert.equal(ctx.cookieRefs['mnemio-palette'].value, 'green');
    assert.equal(JSON.parse(ctx.storage.get('mnemio-appearance')).palette, 'green');
    assert.deepEqual([...ctx.classes], ['dark']);
    assert.deepEqual(ctx.errors, ["Couldn't save. Try again."]);
    assert.equal(ctx.events.length, 0);
    ctx.scope.stop();
});

test('failed saves use the Ukrainian catalog when Ukrainian is active', async () => {
    const ctx = setup({ locale: 'uk' });
    const save = ctx.store.setMascot('red');
    await Promise.resolve();
    ctx.pending[0].reject(new Error('offline'));
    await save;
    assert.deepEqual(ctx.errors, ['Не вдалося зберегти. Спробуйте ще раз.']);
    ctx.scope.stop();
});

test('rapid changes serialize; stale failure does not replace the latest choice', async () => {
    const ctx = setup();
    const first = ctx.store.setMascot('red');
    const second = ctx.store.setMascot('pink');
    await Promise.resolve();
    assert.deepEqual(ctx.patches, [{ mascot: 'red' }]);
    ctx.pending[0].reject(new Error('offline'));
    await first;
    assert.equal(ctx.store.mascot.value, 'pink');
    await Promise.resolve();
    assert.deepEqual(ctx.patches, [{ mascot: 'red' }, { mascot: 'pink' }]);
    ctx.pending[1].resolve({});
    await second;
    assert.equal(ctx.store.mascot.value, 'pink');
    ctx.scope.stop();
});

test('a later failed selection rolls back to the last successfully saved selection', async () => {
    const ctx = setup();
    const first = ctx.store.setMascot('red');
    const second = ctx.store.setMascot('pink');
    await Promise.resolve();
    ctx.pending[0].resolve({});
    await first;
    await Promise.resolve();
    ctx.pending[1].reject(new Error('offline'));
    await second;
    assert.equal(ctx.store.mascot.value, 'red');
    ctx.scope.stop();
});

test('logout invalidates in-flight saves and cancels queued old-account saves', async () => {
    const ctx = setup();
    const first = ctx.store.setPalette('violet');
    const second = ctx.store.setMascot('pink');
    await Promise.resolve();
    ctx.store.reset();
    ctx.pending[0].resolve({});
    await Promise.all([first, second]);
    assert.equal(ctx.store.palette.value, 'green');
    assert.equal(ctx.store.mascot.value, 'panda');
    assert.deepEqual(ctx.patches, [{ palette: 'violet' }]);
    assert.equal(ctx.events.length, 0);
    ctx.scope.stop();
});

const css = readFileSync('app/assets/css/main.css', 'utf8');
const tokens = (selector) => {
    const body = css.slice(css.indexOf(selector) + selector.length).split('}')[0];
    return Object.fromEntries(
        [...body.matchAll(/(--c-[\w-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1], match[2]]),
    );
};
const luminance = (rgb) =>
    rgb
        .map((value) => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        })
        .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
const contrast = (a, b) => {
    const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (values[0] + 0.05) / (values[1] + 0.05);
};
test('cream on all surfaces passes 4.5:1 in all six looks; status colors stay unchanged', () => {
    for (const theme of ['dark', 'light']) {
        const base = tokens(theme === 'dark' ? ':root,\n.dark {' : '.light {');
        for (const palette of logic.PALETTES) {
            const overrides = palette === 'green' ? {} : tokens(`html.${theme}.pal-${palette} {`);
            const values = { ...base, ...overrides };
            const rgb = (key) => values[`--c-${key}`].trim().split(/\s+/).map(Number);
            const ratios = ['bg-base', 'bg-base-2', 'bg-surface', 'bg-surface-2', 'bg-deep'].map(
                (surface) => contrast(rgb('cream'), rgb(surface)),
            );
            assert.ok(Math.min(...ratios) >= 4.5, `${theme}/${palette}: ${Math.min(...ratios)}`);
            for (const status of ['ok', 'bad', 'warn', 'error']) {
                assert.equal(values[`--c-${status}`], base[`--c-${status}`]);
            }
            const stops = [...values['--c-cta-grad'].matchAll(/#([\da-f]{6})/gi)].map((match) =>
                [0, 2, 4].map((index) => parseInt(match[1].slice(index, index + 2), 16)),
            );
            const ctaMinimum = Math.min(...stops.map((stop) => contrast(rgb('on-cta'), stop)));
            console.log(
                `${theme}/${palette}: cream minimum ${Math.min(...ratios).toFixed(2)}:1; CTA minimum ${ctaMinimum.toFixed(2)}:1`,
            );
        }
    }
});
