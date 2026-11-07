// Local runner = `wrangler dev` on the built worker, but the worker's outbound fetches (Turnstile
// siteverify) go through Node's fetch, so they work behind an HTTPS proxy (workerd itself does not
// use HTTPS_PROXY). Used only for the Stage 8 self-checks in a proxied sandbox; not part of the site.
//
//   npm run build && NODE_USE_ENV_PROXY=1 node scripts/stage8/dev-proxy.mjs [port]
//
// Reads .dev.vars like `wrangler dev`. Extra vars for a run can be passed as VAR_<NAME>=value env vars.
import { unstable_startWorker } from 'wrangler';

const port = Number(process.argv[2] ?? 8787);
const vars = Object.fromEntries(
  Object.entries(process.env)
    .filter(([k]) => k.startsWith('VAR_'))
    .map(([k, v]) => [k.slice(4), { type: 'plain_text', value: v }]),
);

const worker = await unstable_startWorker({
  config: 'dist/server/wrangler.json',
  bindings: vars,
  dev: {
    server: { hostname: '127.0.0.1', port },
    persist: '.wrangler/state',
    inspector: false,
    watch: false,
    outboundService: (request) => fetch(request.url, request),
  },
});
await worker.ready;
console.log(`ready on ${await worker.url}`);
process.on('SIGTERM', async () => { await worker.dispose(); process.exit(0); });
process.on('SIGINT', async () => { await worker.dispose(); process.exit(0); });
