// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { SITE_URL } from './src/site.config.mjs';
import ogImages from './src/integrations/og-images.mjs';

export default defineConfig({
  site: SITE_URL,
  // Every page is prerendered at build time; only /test/ and /api/* (Stage 8) run on Workers.
  output: 'static',
  // 'ignore', not 'always': with 'always' Astro would 301/308-redirect /api/questions and /api/score
  // (approved paths have no trailing slash) and would redirect instead of 404 when the quiz is off.
  // Static pages are unaffected: Cloudflare's asset layer still redirects /about → /about/.
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  adapter: cloudflare({
    // Images are compressed at build time (sharp → webp); no Cloudflare Images binding needed.
    imageService: 'compile',
  }),
  // Sessions would add a cookie and a KV binding — both out of scope until Stage 8.
  session: false,
  integrations: [ogImages()],
});
