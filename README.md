# harborwish-site

English emotion-animal field guide. Astro (static, prerendered) + `@astrojs/cloudflare`,
deployed to Cloudflare Workers. Project rules live in `CLAUDE.md`.

## Commands

```sh
npm install
npm run dev      # local dev server
npm run build    # prerender everything into dist/
npm run check    # type-check
npx wrangler deploy
```

## Layout

- `src/content/animals/*.md` — one file per animal (file name = URL slug; `order` sets list order and is never rendered)
- `src/assets/animals/{slug}.png` — poster for each animal (shipped only as webp)
- `src/integrations/og-images.mjs` — builds the 1200×630 JPG share image for each animal into `/og/animals/`
- `stage3/` — original Stage 3 inputs from the owner (kept as delivered; do not edit)
- `src/pages/animals/[slug].astro` — animal page template
- `src/pages/api/` — reserved for future Worker endpoints (none yet)
- `wrangler.jsonc` — Workers config; the D1 binding will be added in Stage 8
- `src/site.config.mjs` — production domain; `LEGAL_LAST_UPDATED` (date on the legal pages)
- `docs/submission-copy-v0.3.md` — approved page copy for the Paddle submission pages (use verbatim)
