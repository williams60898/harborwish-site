// Stage 8 result token. Server-side only: only /api/* endpoints may import this module.
// Issued now, verified at Stage 9 checkout. Never put the token in a URL, cookie, storage or log.
//
// token = base64url(JSON payload) + "." + base64url(HMAC-SHA256(first part)), key = RESULT_SIGNING_KEY.
// payload = { v: 1, rid, animal, intensity, iat } — no scores, sums, slots or codes.

export interface ResultTokenPayload {
  v: 1;
  rid: string;
  animal: string;
  intensity: string;
  iat: number;
}

export interface ResultTokenEnv {
  RESULT_SIGNING_KEY?: string;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) return null;
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

async function hmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);
}

function requireKey(env: ResultTokenEnv): string {
  const key = env.RESULT_SIGNING_KEY;
  if (!key) throw new Error('RESULT_SIGNING_KEY missing');
  return key;
}

export async function issueResultToken(
  { animal, intensity }: { animal: string; intensity: string },
  env: ResultTokenEnv,
): Promise<{ resultId: string; token: string }> {
  const secret = requireKey(env);
  const resultId = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const payload: ResultTokenPayload = { v: 1, rid: resultId, animal, intensity, iat: Math.floor(Date.now() / 1000) };
  const body = toBase64Url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret, 'sign'), enc.encode(body));
  return { resultId, token: `${body}.${toBase64Url(new Uint8Array(sig))}` };
}

/** Returns the payload if the signature is valid (constant-time crypto.subtle.verify), else null. */
export async function verifyResultToken(token: unknown, env: ResultTokenEnv): Promise<ResultTokenPayload | null> {
  const secret = env.RESULT_SIGNING_KEY;
  if (!secret || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sigPart] = parts;
  const sig = fromBase64Url(sigPart);
  if (!body || !sig) return null;
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret, 'verify'), sig, enc.encode(body));
  if (!ok) return null;
  const raw = fromBase64Url(body);
  if (!raw) return null;
  try {
    const p = JSON.parse(dec.decode(raw));
    if (
      p && p.v === 1 && typeof p.rid === 'string' && typeof p.animal === 'string' &&
      typeof p.intensity === 'string' && typeof p.iat === 'number'
    ) {
      return { v: 1, rid: p.rid, animal: p.animal, intensity: p.intensity, iat: p.iat };
    }
  } catch {
    // fall through
  }
  return null;
}
