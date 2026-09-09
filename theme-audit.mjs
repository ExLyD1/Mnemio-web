/*
 * Lavender theme audit. Checks the two things that silently break a theme pair:
 *   1. token parity  — a --c-* defined in one block but not the other
 *   2. ink-on-surface — cream-ladder ink on a solid plum/purple fill (invisible
 *      in light mode) or on-plum ink on a page/card surface (invisible in dark)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync('app/assets/css/main.css', 'utf8');

const block = (selector) => {
    const start = css.indexOf(selector);
    if (start === -1) throw new Error(`block not found: ${selector}`);
    const open = css.indexOf('{', start);
    let depth = 0;
    for (let i = open; i < css.length; i++) {
        if (css[i] === '{') depth++;
        else if (css[i] === '}') {
            depth--;
            if (depth === 0) return css.slice(open, i);
        }
    }
    throw new Error('unbalanced');
};

const tokens = (text) => new Set([...text.matchAll(/(--c-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

const darkTokens = tokens(block(':root,'));
const lightTokens = tokens(block('.light {'));

let failures = 0;

console.log('=== 1. Token parity between .dark and .light ===');
const onlyDark = [...darkTokens].filter((t) => !lightTokens.has(t));
const onlyLight = [...lightTokens].filter((t) => !darkTokens.has(t));
if (onlyDark.length === 0 && onlyLight.length === 0) {
    console.log(`  PASS — both blocks define the same ${darkTokens.size} tokens`);
} else {
    failures++;
    if (onlyDark.length) console.log('  FAIL missing from .light:', onlyDark.join(', '));
    if (onlyLight.length) console.log('  FAIL missing from .dark :', onlyLight.join(', '));
}

console.log('\n=== 2. Every var() reference resolves to a defined token ===');
const referenced = new Set([...css.matchAll(/var\((--c-[a-z0-9-]+)/g)].map((m) => m[1]));
const tw = readFileSync('tailwind.config.ts', 'utf8');
for (const m of tw.matchAll(/var\((--c-[a-z0-9-]+)/g)) referenced.add(m[1]);
const walk = (dir, out = []) => {
    for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p, out);
        else if (/\.(vue|ts)$/.test(e)) out.push(p);
    }
    return out;
};
const files = walk('app');
for (const f of files) {
    for (const m of readFileSync(f, 'utf8').matchAll(/var\((--c-[a-z0-9-]+)/g)) referenced.add(m[1]);
}
const undef = [...referenced].filter((t) => !darkTokens.has(t));
if (undef.length === 0) console.log(`  PASS — all ${referenced.size} referenced tokens defined`);
else {
    failures++;
    console.log('  FAIL undefined tokens referenced:', undef.join(', '));
}

console.log('\n=== 3. Ink-on-surface violations ===');
// Solid (non-alpha) plum/purple fills. Translucent tints (bg-brand/20) are light
// lavender in light mode and correctly take cream ink, so they are excluded.
const SOLID_FILL = /\b(bg-brand|bg-plum|bg-plum-2|bg-plum-deep|bg-hero|bg-card-plum|bg-plum-card-back|bg-lavender|bg-purple)(?![-/\w])/;
const CREAM_INK = /\btext-(cream|cream-dim|cream-faint|brand-muted|brand-pale|brand-light)(?![-\w])/;
const SURFACE = /\b(bg-bg-surface|bg-bg-surface-2|bg-bg-base|bg-bg-deep|bg-card-dark|bg-plum-card)(?![-/\w])/;
const ONPLUM_INK = /\btext-on-plum(-dim|-faint)?(?![-\w])/;

const violations = [];
for (const f of files.filter((f) => f.endsWith('.vue'))) {
    const lines = readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, i) => {
        if (SOLID_FILL.test(line) && CREAM_INK.test(line))
            violations.push(`${f}:${i + 1}  cream ink on a solid plum fill`);
        if (SURFACE.test(line) && ONPLUM_INK.test(line))
            violations.push(`${f}:${i + 1}  on-plum ink on a card/page surface`);
    });
}
if (violations.length === 0) console.log('  PASS — no same-element violations found');
else {
    failures++;
    for (const v of violations) console.log('  FAIL ' + v);
}

console.log('\n=== 4. Literal colors in component code ===');
const lits = [];
for (const f of files.filter((f) => f.endsWith('.vue'))) {
    readFileSync(f, 'utf8')
        .split('\n')
        .forEach((line, i) => {
            if (/#[0-9A-Fa-f]{3,8}\b|rgba\(/.test(line)) lits.push(`${f}:${i + 1}  ${line.trim().slice(0, 70)}`);
        });
}
const ALLOWED = /FlashCard\.vue|decks\\create\.vue|decks\/create\.vue/;
const bad = lits.filter((l) => !ALLOWED.test(l));
console.log(`  ${lits.length} literal(s) total; ${lits.length - bad.length} in documented exceptions`);
if (bad.length === 0) console.log('  PASS — no undocumented literals');
else {
    failures++;
    for (const b of bad) console.log('  FAIL ' + b);
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK GROUP(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
