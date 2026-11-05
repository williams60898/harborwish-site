# /api (reserved)

Future API routes go here. They run on Cloudflare Workers, so each file must
opt out of prerendering with `export const prerender = false;`.

Rules (see CLAUDE.md):

- Do not add any endpoint without the owner's approval.
- Nothing that collects personal data before Stage 8 (the test system launch).
- Scoring rules and paid sections stay server-side only.
- Secrets come from Cloudflare encrypted variables, never from code.

Files starting with `_` are ignored by Astro routing, so this note is never served.
