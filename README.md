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

- `src/content/animals/*.md` — one file per animal (file name = URL slug)
- `src/pages/animals/[slug].astro` — animal page template
- `src/pages/api/` — reserved for future Worker endpoints (none yet)
- `wrangler.jsonc` — Workers config; D1 binding is commented out until the database exists
- `src/site.config.mjs` — production domain
