// Self-checks 3, 5, 6 (+ part of 10/14) against a running local worker.
//   node scripts/stage8/check-api.mjs [baseUrl]
// Each functional request uses its own CF-Connecting-IP so the rate limiter does not interfere
// (the rate limiter itself is checked separately). Prints the number of successful scorings.
import { readFileSync } from 'node:fs';
import { BANK } from '../../src/server/quiz/questions.en.js';
import { verifyResultToken } from '../../src/server/result-token.ts';

const BASE = process.argv[2] ?? 'http://localhost:8787';
const devVars = Object.fromEntries(
  readFileSync(new URL('../../.dev.vars', import.meta.url), 'utf8').split('\n').filter(Boolean).map((l) => l.split(/=(.*)/s).slice(0, 2)),
);
const env = { RESULT_SIGNING_KEY: devVars.RESULT_SIGNING_KEY };
const AXES = ['valence', 'energy', 'control', 'social', 'time', 'clarity'];

let failures = 0;
let ipCounter = 0;
let scored = 0;
const check = (ok, msg) => { if (!ok) failures++; console.log(ok ? 'ok  ' : 'FAIL', msg); };
const ip = () => `10.1.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;

async function score(answers, turnstile = 'XXXX.DUMMY.TOKEN.XXXX') {
  const res = await fetch(`${BASE}/api/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip() },
    body: JSON.stringify({ answers, turnstile }),
  });
  const body = await res.json().catch(() => null);
  if (res.status === 200) scored++;
  return { status: res.status, body, headers: res.headers };
}

/** Option ids: per axis, three different questions with the given scores. */
function pick(spec) {
  return AXES.flatMap((axis) => spec[axis].map((s, i) => BANK[axis].base[i].options.find((o) => o.score === s).id));
}
const all = (s) => Object.fromEntries(AXES.map((a) => [a, [s, s, s]]));

// --- 3. Four anchors ---
const anchors = [
  ['all 0', all(0), 'snow-leopard', 'hhhhhh'],
  ['all 3', all(3), 'monkey', 'hhhhhh'],
  ['valence 3, rest 0', { ...all(0), valence: [3, 3, 3] }, 'panda', 'hhhhhh'],
  ['mixed', { valence: [3, 3, 2], energy: [3, 2, 1], control: [3, 3, 3], social: [3, 3, 2], time: [2, 1, 1], clarity: [1, 1, 2] }, 'corgi', 'hmhhll'],
];
for (const [label, spec, slug, intensity] of anchors) {
  const r = await score(pick(spec));
  const p = await verifyResultToken(r.body?.token, env);
  check(r.status === 200 && r.body.animal.slug === slug && p?.animal === slug && p?.intensity === intensity,
    `3. ${label}: ${r.status} → ${r.body?.animal?.slug} "${r.body?.animal?.name}" token.intensity=${p?.intensity} (want ${slug}, ${intensity})`);
  if (label === 'all 0') {
    console.log('     full response keys:', Object.keys(r.body).join(','), '| coordinates:', r.body.coordinates.join(' · '), '| safety:', r.body.safety, '| chapter:', r.body.chapter);
    check(Object.keys(r.body).sort().join() === 'animal,chapter,coordinates,safety,token', '3. response has only animal, coordinates, safety, chapter, token');
    check(Object.keys(r.body.animal).sort().join() === 'name,slug,tagline', '3. animal has only slug, name, tagline');
    check(r.headers.get('cache-control') === 'no-store', `14. /api/score Cache-Control: ${r.headers.get('cache-control')}`);
  }
  if (label === 'mixed') console.log('     corgi coordinates:', r.body.coordinates.join(' · '), '| safety:', r.body.safety, '| chapter:', r.body.chapter);
}

// --- 5. /api/questions × 20 ---
const optionScore = new Map();
const optionQuestion = new Map();
for (const axis of AXES) for (const q of BANK[axis].base) for (const o of q.options) { optionScore.set(o.id, o.score); optionQuestion.set(o.id, q.id); }
const ALLOWED = new Set(['questions', 'scene', 'options', 'id', 'text']);
const badKeys = new Set();
const walk = (v) => {
  if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (!ALLOWED.has(k)) badKeys.add(k); walk(x); }
};
const positions = [0, 0, 0, 0];
const orders = new Set();
let shapeOk = true;
let qHeaders;
for (let i = 0; i < 20; i++) {
  const res = await fetch(`${BASE}/api/questions`, { headers: { 'CF-Connecting-IP': ip() } });
  qHeaders = res.headers;
  const data = await res.json();
  walk(data);
  if (res.status !== 200 || data.questions.length !== 18 || !data.questions.every((q) => q.options.length === 4)) shapeOk = false;
  // 3 per axis, 18 distinct questions
  const qids = data.questions.map((q) => optionQuestion.get(q.options[0].id));
  const perAxis = AXES.map((a) => qids.filter((id) => id.startsWith(a + '-')).length);
  if (new Set(qids).size !== 18 || !perAxis.every((n) => n === 3)) shapeOk = false;
  for (const q of data.questions) positions[q.options.findIndex((o) => optionScore.get(o.id) === 3)]++;
  orders.add(qids.join(','));
}
check(shapeOk, '5. 20 calls: each 200, 18 questions (3 per axis, all different), 4 options each');
check(badKeys.size === 0, `5. JSON keys only questions/scene/options/id/text (extra: ${[...badKeys].join(',') || 'none'})`);
const total = positions.reduce((a, b) => a + b, 0);
const pct = positions.map((n) => (100 * n) / total);
check(pct.every((p) => p >= 15 && p <= 35), `5. score-3 option position 1–4: ${positions.join(' / ')} of ${total} = ${pct.map((p) => p.toFixed(1) + '%').join(' / ')}`);
check(orders.size === 20, `5. distinct question orders across 20 calls: ${orders.size}`);
check(qHeaders.get('cache-control') === 'no-store', `14. /api/questions Cache-Control: ${qHeaders.get('cache-control')}`);

// --- 6. Validation: 7 bad requests ---
const good = pick(all(0));
const otherOptionSameQ = BANK.valence.base[0].options.find((o) => o.id !== good[0]).id;
const fourOne = [...good.slice(0, 3), BANK.valence.base[5].options[0].id, good[3], good[4], ...good.slice(6)]; // valence 4, energy 2
const cases = [
  ['17 answers', good.slice(0, 17)],
  ['19 answers', [...good, BANK.clarity.base[9].options[0].id]],
  ['same option twice', [good[0], ...good.slice(0, 17)]],
  ['two options of one question', [otherOptionSameQ, ...good.slice(1)].map((x, i) => (i === 1 ? good[0] : x))],
  ['valence 4, energy 2', fourOne],
  ['unknown id', ['zzzzzzzzzz', ...good.slice(1)]],
  ['answers not an array', 'not-an-array'],
];
for (const [label, answers] of cases) {
  const r = await score(answers);
  check(r.status === 400 && r.body?.error === 'invalid_answers' && !('token' in (r.body ?? {})), `6. ${label} (${Array.isArray(answers) ? answers.length : typeof answers}): ${r.status} ${JSON.stringify(r.body)}`);
}

console.log(`SCORED_OK=${scored}`);
console.log(failures ? `FAILED: ${failures}` : 'ALL PASS');
process.exit(failures ? 1 : 0);
