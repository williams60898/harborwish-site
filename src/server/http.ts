// Small response helpers for the Stage 8 endpoints. Errors carry only an error code.

export const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });

/** Plain 404 for when the quiz is switched off: no redirect, no hint. */
export const notFound = () => new Response(null, { status: 404 });

export interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** Key = CF-Connecting-IP, used in memory only. Missing binding → allowed (local tools without it). */
export async function overLimit(limiter: RateLimiter | undefined, request: Request): Promise<boolean> {
  if (!limiter) return false;
  const key = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const { success } = await limiter.limit({ key });
  return !success;
}
