// Fails CI when the EN and UK catalogs drift apart. Two invariants:
//   1. identical set of leaf keys (no key added to one locale but not the other)
//   2. matching {token} placeholders per key (so manual .replace() interpolation lines up)
// Run: node .github/scripts/i18n-parity.mjs
import { readFileSync } from 'node:fs';

const load = (p) => JSON.parse(readFileSync(new URL(`../../app/i18n/${p}`, import.meta.url), 'utf8'));
const en = load('en.json');
const uk = load('uk.json');

const leaves = (obj, prefix = '') => {
    let out = [];
    if (Array.isArray(obj)) {
        obj.forEach((v, i) => (out = out.concat(leaves(v, `${prefix}[${i}]`))));
    } else if (obj && typeof obj === 'object') {
        for (const k of Object.keys(obj)) {
            out = out.concat(leaves(obj[k], prefix ? `${prefix}.${k}` : k));
        }
    } else {
        out.push([prefix, String(obj)]);
    }
    return out;
};

const enLeaves = leaves(en);
const ukLeaves = leaves(uk);
const enKeys = new Set(enLeaves.map(([k]) => k));
const ukKeys = new Set(ukLeaves.map(([k]) => k));

const missingInUk = [...enKeys].filter((k) => !ukKeys.has(k));
const missingInEn = [...ukKeys].filter((k) => !enKeys.has(k));

const tokens = (s) => (s.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).sort().join(',');
const ukMap = new Map(ukLeaves);
const tokenMismatches = [];
for (const [k, v] of enLeaves) {
    if (ukMap.has(k) && tokens(v) !== tokens(ukMap.get(k))) {
        tokenMismatches.push(`${k}: en[${tokens(v)}] vs uk[${tokens(ukMap.get(k))}]`);
    }
}

const problems = [];
if (missingInUk.length) problems.push(`Keys missing in uk.json:\n  ${missingInUk.join('\n  ')}`);
if (missingInEn.length) problems.push(`Keys missing in en.json:\n  ${missingInEn.join('\n  ')}`);
if (tokenMismatches.length) problems.push(`Token mismatches:\n  ${tokenMismatches.join('\n  ')}`);

if (problems.length) {
    console.error('✖ i18n catalog parity FAILED\n');
    console.error(problems.join('\n\n'));
    process.exit(1);
}

console.log(`✓ i18n parity OK — ${enLeaves.length} leaves, keys + tokens match across en/uk`);
