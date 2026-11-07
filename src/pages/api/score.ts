import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { isQuizEnabled, isLocalHost } from '../../server/quiz-gate';
import { json, notFound, overLimit } from '../../server/http';
import { scoresFromAnswers, scoreAnswers } from '../../server/quiz/service';
import { issueResultToken } from '../../server/result-token';
import { verifyTurnstile } from '../../server/turnstile';
import { recordAnimal } from '../../server/stats';

export const prerender = false;

// Slugs that have a free-chapter content file. Only the file names are used; '?raw' keeps the
// glob from pulling the content files' images into the build.
const CHAPTER_SLUGS = new Set(
  Object.keys(import.meta.glob('/src/content/animals/*.md', { query: '?raw' })).map((p) => p.replace(/^.*\/|\.md$/g, '')),
);

const REQUIRED_SECRETS = ['RESULT_SIGNING_KEY', 'TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY'] as const;

export const POST: APIRoute = async ({ request, locals }) => {
  const e = env;
  // 1. Switch → 2. rate limit → 3. secrets present → 4. Turnstile → 5. validate → score → token → stats.
  if (!isQuizEnabled(request, e)) return notFound();
  if (await overLimit(e.SCORE_LIMITER, request)) return json({ error: 'rate_limited' }, 429);

  const missing = REQUIRED_SECRETS.filter((k) => !e[k]);
  if (missing.length) {
    console.error(`${missing.join(', ')} missing`);
    return json({ error: 'server_config' }, 500);
  }

  let body: { answers?: unknown; turnstile?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  const host = new URL(request.url).hostname;
  const bot = await verifyTurnstile(body?.turnstile, e.TURNSTILE_SECRET_KEY!, host, isLocalHost(host));
  if (bot === 'unavailable') return json({ error: 'bot_check_unavailable' }, 503);
  if (bot !== 'ok') return json({ error: 'bot_check_failed' }, 403);

  const scores = scoresFromAnswers(body?.answers);
  if (!scores) return json({ error: 'invalid_answers' }, 400);

  const result = scoreAnswers(scores);
  const { token } = await issueResultToken({ animal: result.animal.slug, intensity: result.intensity }, e);

  locals.cfContext.waitUntil(recordAnimal(e, result.animal.slug));

  return json({
    animal: result.animal,
    coordinates: result.coordinates,
    safety: result.safety,
    chapter: CHAPTER_SLUGS.has(result.animal.slug),
    token,
  });
};
