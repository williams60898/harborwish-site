// Cloudflare Turnstile server-side check. Server-side only.

export type TurnstileOutcome = 'ok' | 'failed' | 'unavailable';

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Calls siteverify (no remoteip). `ok` only when success is true and the reported hostname equals
 * the request host. `skipHostnameCheck` is used only for localhost / 127.0.0.1, because the official
 * test keys always report "example.com" (verified against siteverify on 2026-11-07).
 */
export async function verifyTurnstile(
  token: unknown,
  secret: string,
  requestHost: string,
  skipHostnameCheck: boolean,
  fetchImpl: typeof fetch = fetch,
): Promise<TurnstileOutcome> {
  if (typeof token !== 'string' || token.length === 0 || token.length > 4096) return 'failed';
  let data: { success?: unknown; hostname?: unknown };
  try {
    const res = await fetchImpl(SITEVERIFY, {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token }),
    });
    if (!res.ok) return 'unavailable';
    data = await res.json();
  } catch {
    return 'unavailable';
  }
  if (data.success !== true) return 'failed';
  if (!skipHostnameCheck && data.hostname !== requestHost) return 'failed';
  return 'ok';
}
