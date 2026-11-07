#!/bin/bash
# Runs every Stage 8 self-check locally, in order. Needs .dev.vars with the Turnstile test keys
# (see docs/stage8/STAGE8_BRIEF.md §6.3). Usage: bash scripts/stage8/run-all.sh
cd "$(dirname "$0")/../.."
export NODE_NO_WARNINGS=1
LOG=$(mktemp -d)
SERVER_PID=
start() { # start the local worker; extra worker vars as VAR_<NAME>=value
  stop
  env "$@" NODE_USE_ENV_PROXY=1 node scripts/stage8/dev-proxy.mjs 8787 > "$LOG/dev.log" 2>&1 &
  SERVER_PID=$!
  for i in $(seq 1 40); do curl -s -o /dev/null http://localhost:8787/ && return 0; sleep 1; done
  echo "worker did not start"; cat "$LOG/dev.log"; exit 1
}
stop() { [ -n "$SERVER_PID" ] && kill $SERVER_PID 2>/dev/null && wait $SERVER_PID 2>/dev/null; SERVER_PID=; pkill -f workerd 2>/dev/null; sleep 1; }
trap stop EXIT
d1() { npx wrangler d1 execute DB --local --json --command "$1" 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.stringify(JSON.parse(s)[0].results)))'; }
post() { curl -s -w ' HTTP %{http_code}' -X POST -H "CF-Connecting-IP: $1" -H 'Content-Type: application/json' -d "$2" http://localhost:8787/api/score; echo; }

echo "### 15. build + type check"
npm run build > "$LOG/build.log" 2>&1 && echo "npm run build: OK ($(grep -c '├─\|└─' "$LOG/build.log") prerendered files)" || { tail -30 "$LOG/build.log"; exit 1; }
npm run check > "$LOG/check.log" 2>&1 && grep -A3 "^Result" "$LOG/check.log" || { tail -30 "$LOG/check.log"; exit 1; }

echo; echo "### 1, 8 (build), 12, 13"
bash scripts/stage8/check-dist.sh

echo; echo "### 2, 4"
node scripts/stage8/check-data.mjs

echo; echo "### 7 (module)"
node scripts/stage8/check-token.mjs

echo; echo "### 8 (isQuizEnabled)"
node scripts/stage8/check-gate.mjs

echo; echo "### local D1: migrate + empty the table"
npx wrangler d1 migrations apply DB --local 2>&1 | grep -E "No migrations|✅" 
d1 "DELETE FROM daily_animal_counts" > /dev/null; echo "rows now: $(d1 'SELECT COUNT(*) AS n FROM daily_animal_counts')"

start
echo; echo "### 3, 5, 6, 14 (API)"
node scripts/stage8/check-api.mjs | tee "$LOG/api.txt"
API_OK=$(grep -o 'SCORED_OK=[0-9]*' "$LOG/api.txt" | cut -d= -f2)
echo "D1 total after the API checks (4 anchors scored, 7 invalid not): $(d1 'SELECT SUM(count) AS total FROM daily_animal_counts')"

echo; echo "### 3 (browser: free-chapter embed incl. snow leopard crisis section + help line), 8.4, error path"
node scripts/stage8/check-browser.mjs http://localhost:8787 | tee "$LOG/browser.txt" | grep -v "page text has no"
echo "(page-text checks: $(grep -c 'ok   .*page text has no' "$LOG/browser.txt") passed, $(grep -c 'FAIL .*page text has no' "$LOG/browser.txt") failed)"
BROWSER_OK=4  # snow-leopard, corgi (its first submission is answered 429 by the test itself), gray-wolf, snow-leopard-chapter-fetch-fails

echo; echo "### 8 (routes by host, QUIZ_PUBLIC=off)"
for h in harborwish-site.williams60898.workers.dev harborwish.com www.harborwish.com abc-harborwish-site.williams60898.workers.dev; do
  printf '%-46s /test/ %s  /api/questions %s  POST /api/score %s\n' "$h" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $h" -H 'Sec-Fetch-Mode: navigate' http://localhost:8787/test/)" \
    "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $h" -H 'CF-Connecting-IP: 10.20.0.1' http://localhost:8787/api/questions)" \
    "$(curl -s -o /dev/null -w '%{http_code}' -X POST -H "Host: $h" -H 'CF-Connecting-IP: 10.20.0.2' -d '{}' http://localhost:8787/api/score)"
done
echo "production-host /test/ body is the site 404 page: $(curl -s -H 'Host: harborwish.com' http://localhost:8787/test/ | grep -o '<title>Page Not Found | Harborwish</title>')"
echo "production-host /api/questions body bytes: $(curl -s -H 'Host: harborwish.com' http://localhost:8787/api/questions | wc -c)"

echo; echo "### 14 (headers)"
curl -s -D - -o /dev/null -H 'CF-Connecting-IP: 10.20.0.3' http://localhost:8787/test/ | grep -iE '^HTTP|x-robots-tag|cache-control'
curl -s -D - -o /dev/null -H 'CF-Connecting-IP: 10.20.0.4' http://localhost:8787/api/questions | grep -iE '^HTTP|cache-control'
curl -s -D - -o /dev/null -X POST -H 'CF-Connecting-IP: 10.20.0.5' -d '{}' http://localhost:8787/api/score | grep -iE '^HTTP|cache-control'

echo; echo "### 9 (rate limit: 100 × POST /api/score from one IP, no Turnstile token)"
for i in $(seq 1 100); do curl -s -o /dev/null -w '%{http_code}\n' -X POST -H 'CF-Connecting-IP: 10.30.0.1' -H 'Content-Type: application/json' -d '{"answers":[]}' http://localhost:8787/api/score; done > "$LOG/rate.txt"
echo "first 12: $(head -12 "$LOG/rate.txt" | tr '\n' ' ')"; sort "$LOG/rate.txt" | uniq -c
echo "requests 11–100 not 429: $(sed -n '11,100p' "$LOG/rate.txt" | grep -vc 429)"

echo; echo "### 8 (QUIZ_PUBLIC=on, temporary — the config file is not touched)"
start VAR_QUIZ_PUBLIC=on
for h in harborwish-site.williams60898.workers.dev harborwish.com www.harborwish.com; do
  printf '%-46s /test/ %s  /api/questions %s\n' "$h" "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $h" http://localhost:8787/test/)" "$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $h" -H 'CF-Connecting-IP: 10.20.1.1' http://localhost:8787/api/questions)"
done
echo "wrangler.jsonc still says: $(grep -c '"QUIZ_PUBLIC": "off"' wrangler.jsonc) × QUIZ_PUBLIC=off"

ANSWERS=$(node -e "import('./src/server/quiz/questions.en.js').then(({BANK})=>console.log(JSON.stringify(['valence','energy','control','social','time','clarity'].flatMap(k=>BANK[k].base.slice(0,3).map(q=>q.options[0].id)))))")
echo; echo "### 10 (Turnstile, official test secrets)"
start VAR_TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA
echo "always-fail secret: $(post 10.40.0.1 "{\"answers\":$ANSWERS,\"turnstile\":\"XXXX.DUMMY.TOKEN.XXXX\"}")"
start
echo "always-pass secret: $(post 10.40.0.2 "{\"answers\":$ANSWERS,\"turnstile\":\"XXXX.DUMMY.TOKEN.XXXX\"}" | sed -E 's/"token":"[^"]{12}[^"]*"/"token":"<redacted>"/')"
TS_OK=1

echo; echo "### 7 (server: missing secrets → 500 server_config, log has only the names)"
start VAR_RESULT_SIGNING_KEY=
echo "no RESULT_SIGNING_KEY: $(post 10.50.0.1 '{}')"; sleep 1; grep -o 'RESULT_SIGNING_KEY missing' "$LOG/dev.log"
start VAR_TURNSTILE_SITE_KEY= VAR_TURNSTILE_SECRET_KEY=
echo "no Turnstile keys: $(post 10.50.0.2 '{}')"; sleep 1; grep -o 'TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY missing' "$LOG/dev.log"
stop

echo; echo "### 11 (local D1)"
echo "tables: $(d1 "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")"
echo "columns: $(d1 "SELECT name, type, pk FROM pragma_table_info('daily_animal_counts')")"
echo "rows: $(d1 'SELECT day, animal, count FROM daily_animal_counts ORDER BY animal')"
TOTAL=$(d1 'SELECT SUM(count) AS t FROM daily_animal_counts' | grep -o '[0-9]*')
EXPECTED=$((API_OK + BROWSER_OK + TS_OK))
echo "SUM(count) = $TOTAL; successful scorings = $API_OK (API) + $BROWSER_OK (browser) + $TS_OK (Turnstile pass) = $EXPECTED → $([ "$TOTAL" = "$EXPECTED" ] && echo match || echo MISMATCH)"
