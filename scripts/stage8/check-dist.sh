#!/bin/bash
# Self-checks 1, 8 (build part), 12, 13. Run after `npm run build`: bash scripts/stage8/check-dist.sh
cd "$(dirname "$0")/../.."
fail=0
say() { echo "$@"; }
bad() { echo "FAIL $*"; fail=1; }

say "== 1. data files"
sha256sum src/server/quiz/engine.js src/server/quiz/scoring.js src/server/quiz/animals.en.js
[ "$(sha256sum < src/server/quiz/engine.js | cut -d' ' -f1)" = 86223e93615a0e91fd6197869dc9c8d63cf2f3d6affacd6d074a65781d16a1e0 ] || bad engine.js
[ "$(sha256sum < src/server/quiz/scoring.js | cut -d' ' -f1)" = d893fcae08fb304829a478062cfea241323c3b8219bb9cc103cbebd7cc070641 ] || bad scoring.js
[ "$(sha256sum < src/server/quiz/animals.en.js | cut -d' ' -f1)" = 19ca55f267edf7aa2d6ebeba4d8fdf3d1c09d28897678d589d59f8e47a10676b ] || bad animals.en.js
d=$(git diff origin/main -- src/server/quiz/questions.en.js | wc -c); say "git diff origin/main -- src/server/quiz/questions.en.js | wc -c → $d"; [ "$d" = 0 ] || bad questions.en.js

say "== 8. build output"
t=$(find dist/client \( -path 'dist/client/test' -o -path 'dist/client/test/*' -o -name 'test.html' \) | wc -l); say "find dist/client -path dist/client/test* -o -name test.html | wc -l → $t"; [ "$t" = 0 ] || bad "static /test/ in dist/client"
say "(files whose name merely contains 'test': $(find dist/client -name '*test*' | tr '\n' ' ')— the page's hashed client script/style, not a page)"
s=$(grep -c '/test' dist/client/sitemap.xml); say "grep -c '/test' dist/client/sitemap.xml → $s"; [ "$s" = 0 ] || bad sitemap
say "home page main button: $(grep -o '<a class="button"[^>]*>[^<]*</a>' dist/client/index.html | head -1)"
grep -q '<a class="button" href="/animals/">Meet the 64 Mood Animals</a>' dist/client/index.html || bad "home button"

say "== 12. browser-facing build output (dist/client only)"
# five scenes from questions.en.js (first 50 chars of a scene, quotes avoided)
for q in valence-3 energy-2 control-5 social-9 time-14; do
  scene=$(node -e "import('./src/server/quiz/questions.en.js').then(({BANK})=>{const [a]=process.argv[1].split('-');console.log(BANK[a].base.find(x=>x.id===process.argv[1]).scene.slice(0,40))})" "$q")
  n=$(grep -rlF -- "$scene" dist/client | wc -l); say "scene $q \"$scene…\" → $n files"; [ "$n" = 0 ] || bad "scene $q"
done
for w in OPTION_SCORE tierOf isHighPole scoreDimension slotOf computeResult buildPool drawThree RESULT_SIGNING_KEY TURNSTILE_SECRET_KEY; do
  n=$(grep -rlF -- "$w" dist/client | wc -l); say "grep -rlF $w dist/client → $n files"; [ "$n" = 0 ] || bad "$w"
done
for w in "Your Undercurrent" "Your Relationships" "Your Trap" "Your Way Out"; do
  files=$(grep -rlF -- "$w" dist/client | tr '\n' ' '); say "grep -rlF \"$w\" dist/client → ${files:-none}"
  for f in $files; do
    case "$f" in
      dist/client/sample-report/index.html) ;;
      # Pre-existing on main (approved submission copy v0.3: the chapter names in the product description).
      dist/client/how-it-works/index.html|dist/client/pricing/index.html)
        src="src/pages/$(basename "$(dirname "$f")").astro"
        [ -z "$(git diff origin/main -- "$src")" ] && say "   $f: pre-existing on main, $src unchanged on this branch" || bad "$w in $f and $src changed";;
      *) bad "$w in $f";;
    esac
  done
done
say "option ids from questions.en.js found in dist/client: $(node -e "import('./src/server/quiz/questions.en.js').then(({BANK})=>{const fs=require('fs'),p=require('path');const ids=Object.values(BANK).flatMap(d=>d.base.flatMap(q=>q.options.map(o=>o.id)));const files=[];const walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>e.isDirectory()?walk(p.join(d,e.name)):/\.(html|js|css|json|xml|txt)$/.test(e.name)&&files.push(p.join(d,e.name)));walk('dist/client');const all=files.map(f=>fs.readFileSync(f,'utf8')).join('\n');console.log(ids.filter(i=>all.includes(i)).length+' of '+ids.length)})")"

say "== 13. browser code: storage / history / hash"
js=$(ls dist/client/_astro/*.js 2>/dev/null); say "client scripts: $(echo $js | tr ' ' ',')"
for w in document.cookie localStorage sessionStorage indexedDB history.pushState history.replaceState location.hash; do
  n=$( (grep -lF -- "$w" $js src/pages/test.astro 2>/dev/null; grep -rlF --include='*.html' -- "$w" dist/client) | sort -u | wc -l)
  say "$w → $n files"; [ "$n" = 0 ] || bad "$w"
done
# indexedDB / storage appear only in scripts/stage8/check-browser.mjs (the test reads them), which is not shipped.
say "== 13. server code: no logging of body / answers / token"
grep -rn "console\." src/server src/pages/api src/pages/test.astro
n=$(grep -rnE "console\.[a-z]+\([^)]*(body|answers|token|request)" src/server src/pages/api src/pages/test.astro | wc -l); say "console.* mentioning body/answers/token/request → $n"; [ "$n" = 0 ] || bad logging

[ $fail = 0 ] && echo "ALL PASS" || { echo "FAILED"; exit 1; }
