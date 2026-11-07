// Types for the Cloudflare runtime bindings used by the Stage 8 endpoints (see wrangler.jsonc).
// Secrets are set in Cloudflare's encrypted variables, never in code.

interface Stage8Env {
  QUIZ_PUBLIC?: string;
  RESULT_SIGNING_KEY?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  SCORE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  QUESTIONS_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  DB?: { prepare(sql: string): { bind(...values: unknown[]): { run(): Promise<unknown> } } };
}

declare module 'cloudflare:workers' {
  export const env: Stage8Env;
}
