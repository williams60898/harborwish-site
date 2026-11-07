# /api

API routes run on Cloudflare Workers, so each file must opt out of prerendering with
`export const prerender = false;`.

Owner-approved endpoints (Stage 8, quiz on preview URLs only):

- `GET /api/questions`: 18 questions (scene + 4 option ids/texts), shuffled.
- `POST /api/score`: `{ answers, turnstile }` → `{ animal, coordinates, safety, chapter, token }`.

Both answer 404 unless `isQuizEnabled()` (src/server/quiz-gate.ts) is true.

Rules (see CLAUDE.md):

- Do not add any endpoint without the owner's approval.
- Never return slots, letter codes, scores, sums or tiers; question ids and dimension names stay server-side.
- Never log answers, request bodies or tokens.
- Scoring rules and paid sections stay server-side only.
- Secrets come from Cloudflare encrypted variables, never from code.

Files starting with `_` are ignored by Astro routing, so this note is never served.
