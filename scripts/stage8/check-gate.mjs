// Self-check 8 (isQuizEnabled unit part): node scripts/stage8/check-gate.mjs
import { isQuizEnabled } from '../../src/server/quiz-gate.ts';

let failures = 0;
const check = (ok, msg) => { if (!ok) failures++; console.log(ok ? 'ok  ' : 'FAIL', msg); };
const req = (host) => new Request(`https://${host}/test/`);
const cases = [
  ['harborwish-site.williams60898.workers.dev', 'off', false],
  ['harborwish.com', 'off', false],
  ['www.harborwish.com', 'off', false],
  ['abc-harborwish-site.williams60898.workers.dev', 'off', true],
  ['a1b2c3d4-harborwish-site.williams60898.workers.dev', 'off', true],
  ['localhost', 'off', true],
  ['127.0.0.1', 'off', true],
  ['-harborwish-site.williams60898.workers.dev', 'off', false],
  ['evil-harborwish-site.williams60898.workers.dev.attacker.com', 'off', false],
  ['abc-harborwish-site.williams60898.workers.dev', undefined, true],
  ['harborwish.com', undefined, false],
  ['harborwish-site.williams60898.workers.dev', 'on', true],
  ['harborwish.com', 'on', true],
  ['www.harborwish.com', 'on', true],
];
for (const [host, pub, want] of cases) {
  const got = isQuizEnabled(req(host), pub === undefined ? {} : { QUIZ_PUBLIC: pub });
  check(got === want, `8. ${host.padEnd(60)} QUIZ_PUBLIC=${String(pub).padEnd(9)} → ${got ? 'on ' : 'off'}`);
}
console.log(failures ? `FAILED: ${failures}` : 'ALL PASS');
process.exit(failures ? 1 : 0);
