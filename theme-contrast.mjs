/*
 * Resolves the Lavender tokens from main.css and checks the contrast floor
 * (both specs §4): body >= 4.5, secondary >= 3.5, tertiary/disabled >= 3,
 * non-text UI >= 3. Alpha inks are composited over their actual surface, and
 * gradients are tested at their LIGHTEST stop as the specs require.
 */
import { readFileSync } from 'node:fs';

const css = readFileSync('app/assets/css/main.css', 'utf8');

const blockText = (sel) => {
    const s = css.indexOf(sel);
    const open = css.indexOf('{', s);
    let d = 0;
    for (let i = open; i < css.length; i++) {
        if (css[i] === '{') d++;
        else if (css[i] === '}' && --d === 0) return css.slice(open, i);
    }
};

const parse = (sel) => {
    const t = {};
    for (const m of blockText(sel).matchAll(/(--c-[a-z0-9-]+)\s*:\s*([^;]+);/g))
        t[m[1]] = m[2].trim();
    return t;
};

const THEMES = { 'grna-dark': parse(':root,'), 'grna-light': parse('.light {') };

const rgb = (t, name) => t[`--c-${name}`].split(/\s+/).map(Number);
const alpha = (t, name) => Number(t[`--c-a-${name}`]);
const over = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));
const lum = ([r, g, b]) =>
    [r, g, b]
        .map((c) => c / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
        .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
// lightest stop of a gradient token
const lightestStop = (val) => {
    const stops = [...val.matchAll(/#[0-9a-fA-F]{6}/g)].map((m) => hex(m[0]));
    return stops.sort((a, b) => lum(b) - lum(a))[0];
};

let fails = 0;
for (const [name, t] of Object.entries(THEMES)) {
    console.log(`\n──────── ${name} ────────`);
    const surf = {
        'bg-base': rgb(t, 'bg-base'),
        'bg-surface': rgb(t, 'bg-surface'),
        'bg-surface-2': rgb(t, 'bg-surface-2'),
        'bg-deep': rgb(t, 'bg-deep'),
        plum: rgb(t, 'plum'),
        'plum-deep': rgb(t, 'plum-deep'),
        purple: rgb(t, 'purple'),
        'card-dark(lightest)': lightestStop(t['--c-card-dark']),
        'card-plum(lightest)': lightestStop(t['--c-card-plum']),
    };
    const cream = rgb(t, 'cream');
    const onPlum = rgb(t, 'on-plum');

    const checks = [
        // body ink on page + card surfaces
        ['cream', cream, 1, 'bg-base', 4.5],
        ['cream', cream, 1, 'bg-surface', 4.5],
        ['cream', cream, 1, 'bg-surface-2', 4.5],
        ['cream', cream, 1, 'bg-deep', 4.5],
        ['cream', cream, 1, 'card-dark(lightest)', 4.5],
        ['cream-dim', cream, alpha(t, 'dim'), 'bg-surface', 3.5],
        ['cream-faint', cream, alpha(t, 'faint'), 'bg-surface', 3.0],
        // ink on plum / gradient fills
        ['on-plum', onPlum, 1, 'plum', 4.5],
        ['on-plum', onPlum, 1, 'plum-deep', 4.5],
        ['on-plum', onPlum, 1, 'card-plum(lightest)', 4.5],
        ['on-plum-dim', onPlum, alpha(t, 'on-plum-dim'), 'plum', 3.5],
        ['on-plum-faint', onPlum, alpha(t, 'on-plum-faint'), 'plum', 3.0],
        // ink on a solid accent fill
        ['on-accent', rgb(t, 'on-accent'), 1, 'purple', 4.5],
        // accent + status ink on a card surface
        ['purple', rgb(t, 'purple'), 1, 'bg-surface', 3.5],
        ['ok', rgb(t, 'ok'), 1, 'bg-surface', 3.5],
        ['bad', rgb(t, 'bad'), 1, 'bg-surface', 3.5],
        ['error', rgb(t, 'error'), 1, 'bg-surface', 3.5],
        // stat numerals (large display text)
        ['stat-1', rgb(t, 'stat-1'), 1, 'bg-surface-2', 3.0],
        ['stat-2', rgb(t, 'stat-2'), 1, 'bg-surface-2', 3.0],
        ['stat-3', rgb(t, 'stat-3'), 1, 'bg-surface-2', 3.0],
        ['stat-4', rgb(t, 'stat-4'), 1, 'bg-surface-2', 3.0],
        // non-text UI
        ['track', rgb(t, 'track'), alpha(t, 'track'), 'bg-surface', 3.0],
        ['line', rgb(t, 'line'), alpha(t, 'line'), 'bg-surface', 3.0],
    ];

    // "N due" chip: purple ink on purple-soft composited over a card surface
    const chipBg = over(rgb(t, 'purple'), alpha(t, 'purple-soft'), surf['bg-surface']);
    checks.push(['purple on purple-soft chip', rgb(t, 'purple'), 1, '__chip', 4.5]);

    for (const [ink, fg, a, bgName, floor] of checks) {
        const bg = bgName === '__chip' ? chipBg : surf[bgName];
        const r = ratio(over(fg, a, bg), bg);
        const ok = r >= floor;
        if (!ok) fails++;
        console.log(
            `  ${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(6)}:1  (floor ${floor})  ${ink} on ${bgName === '__chip' ? 'purple-soft chip' : bgName}`,
        );
    }
}
console.log(
    `\n${fails === 0 ? 'All pairings meet their floor.' : fails + ' pairing(s) below floor.'}`,
);
