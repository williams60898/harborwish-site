import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { isQuizEnabled } from '../../server/quiz-gate';
import { json, notFound, overLimit } from '../../server/http';
import { drawQuestions } from '../../server/quiz/service';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const e = env;
  if (!isQuizEnabled(request, e)) return notFound();
  if (await overLimit(e.QUESTIONS_LIMITER, request)) return json({ error: 'rate_limited' }, 429);
  return json({ questions: drawQuestions() });
};
