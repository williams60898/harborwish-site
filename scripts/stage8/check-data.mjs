// Self-checks 2 and 4: 64-slot coverage and the English/Chinese label table. Run: node scripts/stage8/check-data.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { codeOf, AXES } from '../../src/server/quiz/engine.js';
import { computeResult, DIMENSIONS, tierOf } from '../../src/server/quiz/scoring.js';
import { ANIMALS_EN } from '../../src/server/quiz/animals.en.js';
import { POLE_LABELS, TIER_CODES } from '../../src/server/quiz/labels.en.js';

let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.log('FAIL', msg); } };

// --- 2. 64 combinations (each axis: three 0s or three 3s) ---
const seen = new Map();
for (let n = 0; n < 64; n++) {
  const bits = AXES.map((_, i) => (n >> (5 - i)) & 1);
  const scores = Object.fromEntries(AXES.map((a, i) => [a.key, bits[i] ? [3, 3, 3] : [0, 0, 0]]));
  const r = computeResult(scores, ANIMALS_EN);
  const row = ANIMALS_EN[r.slot - 1];
  check(row && row.slot === r.slot, `row for slot ${r.slot}`);
  check(r.archetype.slug === row.slug && r.archetype.name === row.name, `slug/name for slot ${r.slot}`);
  check(codeOf(bits) === row.code.replace(/·/g, ''), `code for slot ${r.slot}: ${codeOf(bits)} vs ${row.code}`);
  seen.set(r.slot, (seen.get(r.slot) ?? 0) + 1);
}
const slots = [...seen.keys()].sort((a, b) => a - b);
check(slots.length === 64 && slots[0] === 1 && slots[63] === 64 && [...seen.values()].every((c) => c === 1), 'slots 1..64 once each');
console.log(`2. combos=64 distinct slots=${slots.length} min=${slots[0]} max=${slots.at(-1)} each-once=${[...seen.values()].every((c) => c === 1)}`);
check(ANIMALS_EN.length === 64 && ANIMALS_EN.every((r, i) => r.slot === i + 1), 'ANIMALS_EN sorted 1..64');
check(new Set(ANIMALS_EN.map((r) => r.slug)).size === 64, 'unique slugs');

// Content files vs animals.en.js (slug, name, and the six coordinates vs the code).
const dir = new URL('../../src/content/animals/', import.meta.url);
for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
  const fm = readFileSync(new URL(f, dir), 'utf8').split('---')[1];
  const get = (k) => (fm.match(new RegExp(`^${k}:\\s*(.*)$`, 'm'))?.[1] ?? '').trim().replace(/^"|"$/g, '');
  const slug = get('slug');
  const name = get('name');
  const coords = get('coordinates').replace(/^\[|\]$/g, '').split(',').map((s) => s.trim());
  const row = ANIMALS_EN.find((r) => r.slug === slug);
  const expected = row ? row.code.split('·').map((letter, i) => {
    const d = DIMENSIONS[i];
    return letter === d.high.letter ? POLE_LABELS[d.key].high.en : POLE_LABELS[d.key].low.en;
  }) : [];
  const ok = row && slug === f.replace(/\.md$/, '') && row.name === name && expected.join('|') === coords.join('|');
  check(ok, `content ${f}`);
  console.log(`2. content ${f.padEnd(17)} slot=${String(row?.slot).padStart(2)} name=${row?.name === name ? 'match' : 'MISMATCH'} coordinates=${expected.join('|') === coords.join('|') ? 'match' : 'MISMATCH'}`);
}

// --- 4. label table ---
for (const d of DIMENSIONS) {
  const lab = POLE_LABELS[d.key];
  check(lab.low.zh === d.low.label, `${d.key} low ${lab.low.zh} vs ${d.low.label}`);
  check(lab.high.zh === d.high.label, `${d.key} high ${lab.high.zh} vs ${d.high.label}`);
  console.log(`4. ${d.key.padEnd(8)} low ${d.low.label}=${lab.low.zh}→${lab.low.en}  high ${d.high.label}=${lab.high.zh}→${lab.high.en}`);
}
check(Object.keys(POLE_LABELS).join() === DIMENSIONS.map((d) => d.key).join(), 'label keys order');
const tiers = new Set(Array.from({ length: 10 }, (_, s) => tierOf(s)));
check([...tiers].every((t) => TIER_CODES[t]) && Object.keys(TIER_CODES).length === 3, 'tier codes');
console.log(`4. tiers from tierOf(0..9): ${[...tiers].map((t) => `${t}→${TIER_CODES[t]}`).join(' ')}`);

console.log(failures ? `FAILED: ${failures}` : 'ALL PASS');
process.exit(failures ? 1 : 0);
