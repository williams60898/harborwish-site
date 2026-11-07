// End-to-end check of /test/ in Chromium against a running local worker (Turnstile test site key).
//   node scripts/stage8/check-browser.mjs [baseUrl] [screenshotDir]
import { createRequire } from 'node:module';
// Playwright is pre-installed globally in the sandbox (not a project dependency).
const { chromium } = createRequire(import.meta.url)('playwright');
import { BANK } from '../../src/server/quiz/questions.en.js';

const BASE = process.argv[2] ?? 'http://localhost:8787';
const SHOTS = process.argv[3];
const AXES = ['valence', 'energy', 'control', 'social', 'time', 'clarity'];
const byScene = new Map();
for (const axis of AXES) for (const q of BANK[axis].base) byScene.set(q.scene, { axis, q });

let failures = 0;
const check = (ok, msg) => { if (!ok) failures++; console.log(ok ? 'ok  ' : 'FAIL', msg); };

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
const browser = await chromium.launch({ proxy });

/** Answer all 18 questions; spec[axis] = scores for the 1st, 2nd, 3rd question of that axis shown. */
async function answerAll(page, spec, { stopBefore18 = false } = {}) {
  const used = Object.fromEntries(AXES.map((a) => [a, 0]));
  for (let n = 1; n <= 18; n++) {
    await page.waitForSelector(`[data-screen="question"]:not([hidden]) [data-progress-label]:text("Question ${n} of 18")`);
    const scene = await page.textContent('[data-scene]');
    const { axis, q } = byScene.get(scene);
    const want = spec[axis][used[axis]++];
    const text = q.options.find((o) => o.score === want).text;
    if (n === 18 && stopBefore18) return text;
    await page.locator('.quiz-option', { hasText: text }).first().click();
  }
  return null;
}

async function storageState(page) {
  return page.evaluate(async () => ({
    cookie: document.cookie,
    local: localStorage.length,
    session: sessionStorage.length,
    idb: (await indexedDB.databases()).length,
    hash: location.hash,
    href: location.href,
    history: history.length,
  }));
}

async function run(label, spec, expect) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  if (expect.breakChapter) await page.route('**/animals/*/', (r) => r.fulfill({ status: 500, body: 'x' }));
  await page.goto(`${BASE}/test/`);
  const before = await storageState(page);
  await page.click('[data-action="start"]');

  if (expect.backTest) {
    await page.waitForSelector('[data-progress-label]:text("Question 1 of 18")');
    check(await page.isHidden('[data-action="back"]'), `${label}: no Back on question 1`);
    await page.locator('.quiz-option').first().click();
    await page.waitForSelector('[data-progress-label]:text("Question 2 of 18")');
    check(await page.isVisible('[data-action="back"]'), `${label}: Back visible on question 2`);
    await page.click('[data-action="back"]');
    await page.waitForSelector('[data-progress-label]:text("Question 1 of 18")');
    check((await page.locator('.quiz-option[aria-pressed="true"]').count()) === 1, `${label}: Back returns to question 1 with the earlier choice marked`);
  }

  if (expect.errorFirst) {
    // First submission gets a 429; the page must stay on question 18 and show the sentence.
    let first = true;
    await page.route('**/api/score', (r) => {
      if (first) { first = false; return r.fulfill({ status: 429, contentType: 'application/json', body: '{"error":"rate_limited"}' }); }
      return r.fallback();
    });
    const lastText = await answerAll(page, spec, { stopBefore18: true });
    await page.locator('.quiz-option', { hasText: lastText }).first().click();
    await page.waitForSelector('[data-error="question"]:not([hidden])');
    const msg = await page.textContent('[data-error="question"]');
    const prog = await page.textContent('[data-progress-label]');
    check(msg === 'Too many tries in a row. Please wait a minute, then try again.' && prog === 'Question 18 of 18', `${label}: 429 → "${msg}" while on "${prog}"`);
    await page.locator('.quiz-option', { hasText: lastText }).first().click();
  } else {
    await answerAll(page, spec);
  }

  await page.waitForSelector('[data-screen="result"]:not([hidden])', { timeout: 30000 });
  const r = await page.evaluate(() => {
    const vis = (el) => !!el && !el.closest('[hidden]');
    const $ = (s) => document.querySelector(s);
    const chapter = $('[data-result-chapter]');
    const img = $('[data-result-image] img');
    return {
      kicker: $('.quiz-result-kicker').textContent,
      name: $('[data-result-name]').textContent,
      tagline: $('[data-result-tagline]').textContent,
      moment: $('[data-result-moment]').textContent,
      h1s: document.querySelectorAll('h1').length,
      chapterVisible: vis(chapter),
      chapterHeadings: [...chapter.querySelectorAll('h1,h2')].map((h) => h.tagName + ' ' + h.textContent),
      chapterHelpLine: chapter.querySelector('.help-line')?.textContent ?? null,
      img: img ? { alt: img.alt, loading: img.loading, src: img.currentSrc || img.src } : null,
      fallbackVisible: vis($('[data-result-fallback]')),
      coordinates: vis($('[data-result-coordinates]')) ? $('[data-result-coordinates]').textContent : null,
      onItsWay: vis($('.quiz-on-its-way')) ? $('.quiz-on-its-way').textContent : null,
      safetyVisible: vis($('[data-result-safety]')),
      safetyText: vis($('[data-result-safety]')) ? $('[data-result-safety]').innerText : null,
      bodyText: document.body.innerText,
    };
  });
  const after = await storageState(page);

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  check(r.kicker === 'Your mood animal right now', `${label}: kicker "${r.kicker}"`);
  check(r.name === expect.name, `${label}: name "${r.name}" · tagline "${r.tagline}"`);
  check(r.moment === `Your Mood Moment · ${today}`, `${label}: "${r.moment}"`);
  check(r.h1s === 1, `${label}: h1 count on page = ${r.h1s}`);
  for (const bad of ['Your Undercurrent', 'Your Relationships', 'Your Trap', 'Your Way Out', 'Unlock', 'Buy', '$', 'hhhhhh', 'NLDWRC']) {
    check(!r.bodyText.includes(bad), `${label}: page text has no "${bad}"`);
  }
  if (expect.chapter) {
    check(r.chapterVisible && !r.fallbackVisible, `${label}: free chapter shown, fallback hidden`);
    console.log(`     chapter headings: ${r.chapterHeadings.join(' | ')}`);
    check(r.img && r.img.alt === expect.alt && r.img.loading === 'lazy', `${label}: image alt "${r.img?.alt}" loading=${r.img?.loading} src=${r.img?.src.replace(BASE, '')}`);
    if (expect.cutsTooDeep) {
      check(r.chapterHeadings.includes('H2 If This Page Cuts Too Deep') && /988/.test(r.chapterHelpLine ?? '') && /findahelpline\.com/.test(r.chapterHelpLine ?? ''),
        `${label}: chapter has "If This Page Cuts Too Deep" + help line: "${r.chapterHelpLine}"`);
    }
  } else {
    check(!r.chapterVisible && r.fallbackVisible && !r.img, `${label}: no chapter, no image, fallback shown`);
    check(r.coordinates === expect.coordinates, `${label}: "${r.coordinates}"`);
    check(r.onItsWay === 'This animal’s full chapter is on its way.', `${label}: "${r.onItsWay}"`);
    check(r.safetyVisible === expect.safety, `${label}: safety block ${r.safetyVisible ? 'shown' : 'hidden'}`);
    if (r.safetyVisible) console.log('     safety block:\n       ' + r.safetyText.split('\n').filter(Boolean).join('\n       '));
  }
  check(after.cookie === '' && after.local === 0 && after.session === 0 && after.idb === 0 && after.hash === '' && after.href === before.href && after.history === before.history,
    `${label}: cookie="${after.cookie}" localStorage=${after.local} sessionStorage=${after.session} indexedDB=${after.idb} url unchanged=${after.href === before.href} history ${before.history}→${after.history}`);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${label}.png`, fullPage: true });

  await page.click('[data-action="again"]');
  check(await page.isVisible('[data-screen="start"] h1'), `${label}: Take it again → start page`);
  await ctx.close();
}

const all = (s) => Object.fromEntries(AXES.map((a) => [a, [s, s, s]]));
await run('snow-leopard', all(0), {
  name: 'The Gazing Snow Leopard', chapter: true, cutsTooDeep: true, backTest: true,
  alt: 'The Low-Battery Snow Leopard meme card: “Love you. Not today.”',
});
await run('corgi', { valence: [3, 3, 2], energy: [3, 2, 1], control: [3, 3, 3], social: [3, 3, 2], time: [2, 1, 1], clarity: [1, 1, 2] }, {
  name: 'The Bustling Corgi', chapter: false, safety: false, errorFirst: true,
  coordinates: 'Emotional coordinates: Warm · High · Carried Along · Approaching · Past · Clear',
});
await run('gray-wolf', { ...all(0), time: [3, 3, 3] }, {
  name: 'The Roaming Gray Wolf', chapter: false, safety: true,
  coordinates: 'Emotional coordinates: Cold · Low · In Control · Avoidant · Future · Clear',
});
await run('snow-leopard-chapter-fetch-fails', all(0), {
  name: 'The Gazing Snow Leopard', chapter: false, safety: true, breakChapter: true,
  coordinates: 'Emotional coordinates: Cold · Low · In Control · Avoidant · Past · Clear',
});

await browser.close();
console.log(failures ? `FAILED: ${failures}` : 'ALL PASS');
process.exit(failures ? 1 : 0);
