// Self-check 12 (paid content), browser-facing build output only (dist/client).
// Usage (after `npm run build`): node scripts/stage8/check-paid.mjs
//
// Rule (owner, Stage 8 follow-up):
//   - The four paid chapter NAMES may appear only on /how-it-works/, /pricing/ and /sample-report/.
//     Anywhere else (any other page, script, stylesheet, data file) = FAIL.
//   - Paid chapter BODY text on any page = FAIL. The only exception is the owner-approved, hard-coded
//     ~80-word Your Undercurrent excerpt in the /sample-report/ blockquote (CLAUDE.md), which must match
//     docs/submission-copy-v0.3.md word for word.
//
// Paid chapter bodies are not in this repository, so "body text" is caught three ways:
//   a) on the three allowed pages every text block that names a chapter must be a block of the approved
//      copy (docs/submission-copy-v0.3.md), verbatim; a chapter name used as a heading, or in an attribute,
//      title, meta tag or JSON-LD, fails (that is where a chapter body would be put);
//   b) no sentence of the approved excerpt may appear anywhere except inside that one blockquote;
//   c) the blockquote must equal the approved excerpt exactly (nothing added).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'dist/client';
const COPY = 'docs/submission-copy-v0.3.md';
const NAMES = ['Your Undercurrent', 'Your Relationships', 'Your Trap', 'Your Way Out'];
const ALLOWED = new Set(['how-it-works/index.html', 'pricing/index.html', 'sample-report/index.html']);
const SAMPLE = 'sample-report/index.html';

let fail = 0;
const bad = (m) => { console.log(`FAIL ${m}`); fail = 1; };
const ok = (m) => console.log(`ok   ${m}`);

const decode = (s) =>
  s.replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const norm = (s) => decode(s).replace(/\s+/g, ' ').trim();
const count = (hay, needle) => hay.split(needle).length - 1;

// Approved copy: every paragraph / list item / quote line of the submission copy, markdown stripped.
const copy = fs.readFileSync(COPY, 'utf8');
const approved = new Set(
  copy.split('\n')
    .map((l) => l.replace(/^\s*(?:[-*]|>|#+)\s+/, '').replace(/\*\*|\*/g, ''))
    .map(norm).filter(Boolean),
);
const excerptLine = copy.split('\n').find((l) => l.startsWith('> Everyone around you'));
if (!excerptLine) { bad(`approved excerpt not found in ${COPY}`); process.exit(1); }
const EXCERPT = norm(excerptLine.slice(2));
const sentences = EXCERPT.split(/(?<=[.!?])\s+/).map((s) => s.replace(/[.!?]$/, '')).filter((s) => s.length >= 20);
console.log(`approved excerpt: ${EXCERPT.split(' ').length} words, ${sentences.length} sentences used as fingerprints`);

// Text blocks of an HTML page: the text between two block-level tags (inline tags such as
// strong/em/a are kept inside the block), with whether the block sits inside a heading.
const BLOCK = 'p|li|h[1-6]|blockquote|div|section|article|header|footer|main|nav|aside|ul|ol|dl|dt|dd|td|th|tr|table|figure|figcaption|title|br';
function paragraphs(html) {
  const body = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const parts = body.split(new RegExp(`(<\\/?(?:${BLOCK})\\b[^>]*>)`, 'i'));
  const out = []; let heading = 0;
  for (const part of parts) {
    const t = part.match(new RegExp(`^<(\\/?)(${BLOCK})\\b`, 'i'));
    if (t) { if (/^h[1-6]$/i.test(t[2])) heading += t[1] ? -1 : 1; continue; }
    const text = norm(part.replace(/<[^>]+>/g, ''));
    if (text) out.push({ text, heading: heading > 0 });
  }
  return out;
}

const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p); else if (/\.(html|js|mjs|css|json|xml|txt|svg|webmanifest)$/.test(e.name)) files.push(p);
});
walk(ROOT);
console.log(`scanned ${files.length} text files under ${ROOT}/`);

const seen = new Map(); // rel → total name occurrences
for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  const raw = fs.readFileSync(f, 'utf8');
  const flat = norm(raw.replace(/<[^>]+>/g, ' '));

  // Chapter names.
  const n = NAMES.reduce((a, w) => a + count(raw, w), 0);
  if (n) seen.set(rel, n);
  if (n && !ALLOWED.has(rel)) bad(`chapter name(s) in ${rel} (${n}×) — only how-it-works, pricing, sample-report may name the chapters`);
  if (n && ALLOWED.has(rel)) {
    const paras = paragraphs(raw).filter((b) => NAMES.some((w) => b.text.includes(w)));
    let inApproved = 0;
    for (const b of paras) {
      const k = NAMES.reduce((a, w) => a + count(b.text, w), 0);
      if (b.heading) bad(`${rel}: chapter name used as a heading: "${b.text.slice(0, 80)}"`);
      else if (!approved.has(b.text)) bad(`${rel}: text naming a chapter is not approved copy (possible paid body): "${b.text.slice(0, 120)}…"`);
      else inApproved += k;
    }
    if (inApproved !== n) bad(`${rel}: ${n} chapter-name occurrences, only ${inApproved} inside approved text blocks (title/meta/attribute/JSON-LD/script?)`);
    else ok(`${rel}: ${n} chapter-name occurrences, all inside ${paras.length} approved copy block(s)`);
  }

  // Paid body: the approved excerpt's sentences, outside its one allowed place.
  let scope = flat;
  if (rel === SAMPLE) {
    const quotes = [...raw.matchAll(/<blockquote\b[^>]*class="[^"]*\bexcerpt\b[^"]*"[^>]*>([\s\S]*?)<\/blockquote>/gi)];
    if (quotes.length !== 1) bad(`${rel}: expected exactly 1 excerpt blockquote, found ${quotes.length}`);
    for (const q of quotes) {
      const qt = norm(q[1].replace(/<[^>]+>/g, ' '));
      if (qt === EXCERPT) ok(`${rel}: excerpt blockquote matches ${COPY} word for word (${qt.split(' ').length} words)`);
      else bad(`${rel}: excerpt blockquote differs from the approved excerpt`);
    }
    scope = norm(raw.replace(/<blockquote\b[^>]*class="[^"]*\bexcerpt\b[^"]*"[^>]*>[\s\S]*?<\/blockquote>/gi, ' ').replace(/<[^>]+>/g, ' '));
  }
  // On sample-report `scope` has the blockquote removed; elsewhere also check the raw file (scripts, JSON).
  const hits = sentences.filter((s) => scope.includes(s) || (rel !== SAMPLE && raw.includes(s)));
  if (hits.length) bad(`${rel}: paid body text — ${hits.length} sentence(s) of the Undercurrent excerpt${rel === SAMPLE ? ' outside the approved blockquote' : ''}`);
}

console.log(`files naming a chapter: ${[...seen].map(([k, v]) => `${k} (${v}×)`).join(', ') || 'none'}`);
console.log(fail ? 'CHECK 12 (paid content): FAILED' : 'CHECK 12 (paid content): PASS');
process.exit(fail);
