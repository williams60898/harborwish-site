// Self-check 7 (module part): node scripts/stage8/check-token.mjs
import { issueResultToken, verifyResultToken } from '../../src/server/result-token.ts';

let failures = 0;
const check = (ok, msg) => { if (!ok) failures++; console.log(ok ? 'ok  ' : 'FAIL', msg); };
const env = { RESULT_SIGNING_KEY: 'test-key-' + crypto.randomUUID() };
const other = { RESULT_SIGNING_KEY: 'another-key-' + crypto.randomUUID() };

const { resultId, token } = await issueResultToken({ animal: 'snow-leopard', intensity: 'hhhhhh' }, env);
const p = await verifyResultToken(token, env);
check(p && p.rid === resultId && p.animal === 'snow-leopard' && p.intensity === 'hhhhhh', `7. issued token verifies: ${JSON.stringify(p)}`);

const [body, sig] = token.split('.');
const flip = (s, i) => s.slice(0, i) + (s[i] === 'A' ? 'B' : 'A') + s.slice(i + 1);
check((await verifyResultToken(`${flip(body, 5)}.${sig}`, env)) === null, '7. payload changed by one character → rejected');
check((await verifyResultToken(`${body}.${flip(sig, 5)}`, env)) === null, '7. signature changed by one character → rejected');
check((await verifyResultToken(token, other)) === null, '7. different key → rejected');
check((await verifyResultToken(token, {})) === null, '7. no key → rejected');

const raw = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
check(Object.keys(raw).join(',') === 'v,rid,animal,intensity,iat', `7. payload keys: ${Object.keys(raw).join(',')}`);
check(Buffer.from(raw.rid, 'base64url').length === 16 && !raw.rid.includes('='), `7. rid decodes to ${Buffer.from(raw.rid, 'base64url').length} bytes, no padding`);
check(Number.isInteger(raw.iat) && Math.abs(raw.iat - Date.now() / 1000) < 5, `7. iat is Unix seconds: ${raw.iat}`);

const rids = new Set();
for (let i = 0; i < 1000; i++) rids.add((await issueResultToken({ animal: 'x', intensity: 'llllll' }, env)).resultId);
check(rids.size === 1000, `7. 1,000 tokens → ${rids.size} distinct rids`);

let threw = null;
try { await issueResultToken({ animal: 'x', intensity: 'llllll' }, {}); } catch (e) { threw = e.message; }
check(threw === 'RESULT_SIGNING_KEY missing', `7. issue without key throws: ${threw}`);

console.log(failures ? `FAILED: ${failures}` : 'ALL PASS');
process.exit(failures ? 1 : 0);
