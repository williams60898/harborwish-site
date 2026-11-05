// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { SITE_URL } from './src/site.config.mjs';

export default defineConfig({
  site: SITE_URL,
  // Every page is prerendered at build time; only future /api routes will run on Workers.
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  adapter: cloudflare({
    // Images are compressed at build time (sharp → webp); no Cloudflare Images binding needed.
    imageService: 'compile',
  }),
  // Sessions would add a cookie and a KV binding — both out of scope until Stage 8.
  session: false,
});
