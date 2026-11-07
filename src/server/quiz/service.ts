// Stage 8 quiz service: draw questions, validate answers, score. Server-side only.
// Only /api/* endpoints may import this module (and everything else in src/server/quiz/).
// engine.js, scoring.js, questions.en.js and animals.en.js are used exactly as shipped.

import { AXES } from './engine.js';
import { computeResult } from './scoring.js';
import { BANK, buildPool, drawThree } from './questions.en.js';
import { ANIMALS_EN } from './animals.en.js';
import { poleLabel, TIER_CODES } from './labels.en.js';

const AXIS_KEYS: string[] = AXES.map((a: { key: string }) => a.key);
const QUESTIONS_PER_AXIS = 3;
export const TOTAL_QUESTIONS = AXIS_KEYS.length * QUESTIONS_PER_AXIS; // 18

interface BankOption {
  id: string;
  score: number;
  text: string;
}
interface BankQuestion {
  id: string;
  scene: string;
  options: BankOption[];
}

/** Option id → where it lives. Built once per isolate; never leaves the server. */
const OPTION_INDEX = new Map<string, { questionId: string; axis: string; score: number }>();
for (const axis of AXIS_KEYS) {
  for (const q of (BANK as Record<string, { base: BankQuestion[] }>)[axis].base) {
    for (const o of q.options) OPTION_INDEX.set(o.id, { questionId: q.id, axis, score: o.score });
  }
}

/** Unbiased random integer in [0, n) from crypto.getRandomValues (rejection sampling). */
function randomInt(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % n;
  }
}

/** In-place Fisher–Yates shuffle driven by crypto.getRandomValues. */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface PublicQuestion {
  scene: string;
  options: { id: string; text: string }[];
}

/** 18 questions (3 per axis, in engine.AXES order), options and question order shuffled. */
export function drawQuestions(): PublicQuestion[] {
  const drawn: PublicQuestion[] = [];
  for (const axis of AXIS_KEYS) {
    const three: BankQuestion[] = drawThree(buildPool(axis, {}), []);
    for (const q of three) {
      drawn.push({
        scene: q.scene,
        options: shuffle(q.options.map((o) => ({ id: o.id, text: o.text }))),
      });
    }
  }
  return shuffle(drawn);
}

/** Validated answers → { valence: [a,b,c], … } in engine.AXES order, or null if invalid. */
export function scoresFromAnswers(answers: unknown): Record<string, number[]> | null {
  if (!Array.isArray(answers) || answers.length !== TOTAL_QUESTIONS) return null;
  const questions = new Set<string>();
  const byAxis: Record<string, number[]> = Object.fromEntries(AXIS_KEYS.map((k) => [k, []]));
  for (const id of answers) {
    if (typeof id !== 'string') return null;
    const hit = OPTION_INDEX.get(id);
    if (!hit) return null;
    if (questions.has(hit.questionId)) return null;
    questions.add(hit.questionId);
    byAxis[hit.axis].push(hit.score);
  }
  for (const k of AXIS_KEYS) if (byAxis[k].length !== QUESTIONS_PER_AXIS) return null;
  return byAxis;
}

export interface QuizResult {
  animal: { slug: string; name: string; tagline: string };
  coordinates: string[];
  safety: 'negative' | 'positive';
  /** Six tier letters (l/m/h), valence → clarity. Goes into the token only, never the response. */
  intensity: string;
}

export function scoreAnswers(scoresByKey: Record<string, number[]>): QuizResult {
  const result = computeResult(scoresByKey, ANIMALS_EN);
  const { slug, name, tagline } = result.archetype as { slug: string; name: string; tagline: string };
  const dims = result.dims as { key: string; highPole: boolean; tier: keyof typeof TIER_CODES }[];
  const valence = dims.find((d) => d.key === 'valence')!;
  return {
    animal: { slug, name, tagline },
    coordinates: dims.map((d) => poleLabel(d.key, d.highPole)),
    safety: valence.highPole ? 'positive' : 'negative',
    intensity: dims.map((d) => TIER_CODES[d.tier]).join(''),
  };
}
