# 阶段 8 · 测试系统（只在预览网址）· 给 Claude Code 的说明

草稿 · 2026-11-07 · Williams 审定后放进仓库 docs/stage8/

先读仓库根目录的 CLAUDE.md，再读本说明。两者冲突时以本说明为准，并在 PR 里写明冲突在哪。
动手前先回我：打算怎么做、要新建和改动哪些文件、每条自检怎么跑。我说「可以」再动手。新开分支，做完开 PR，不合并。

---

## 0. 这次做什么，不做什么

访客在网页上做 18 道题（6 个维度各 3 道）→ 服务器打分 → 同一页显示免费结果。
只在预览网址能用。正式网址（现在是 harborwish-site.williams60898.workers.dev，以后是 harborwish.com）上不出现任何测试入口，首页主按钮仍是 Meet the 64 Mood Animals。

这次不做：付款或解锁按钮、价格、任何付费内容、分享图、账号、历史记录、潮版题、隐私页改动、首页和导航改动、其余 56 只动物页。

本次 Williams 同意新增：接口 GET /api/questions、POST /api/score；D1 表 daily_animal_counts；两个限流绑定；D1 绑定 DB；Cloudflare 加密变量 RESULT_SIGNING_KEY、TURNSTILE_SITE_KEY、TURNSTILE_SECRET_KEY（Williams 已在后台加好，代码只读不写）。

## 1. 文件

docs/stage8/ 里有：

- engine.js、scoring.js：小程序 2026-07-22 版。用 git mv 移到 src/server/quiz/，一个字节都不许改。SHA-256：
  - engine.js `86223e93615a0e91fd6197869dc9c8d63cf2f3d6affacd6d074a65781d16a1e0`
  - scoring.js `d893fcae08fb304829a478062cfea241323c3b8219bb9cc103cbebd7cc070641`
- animals.en.js：64 只的英文名表，按格位 1–64 升序，每行 { slot, slug, name, tagline, code }。用 git mv 移到 src/server/quiz/。name 是解读版名（例如 The Gazing Snow Leopard），结果页一律用它；梗卡名不进这张表。
- 本说明留在 docs/stage8/。

src/server/quiz/questions.en.js 已在仓库，不改。

src/server/quiz/ 下所有文件和第 5 节的凭证模块，只许服务器端接口 import；任何页面、组件、浏览器脚本都不许 import。

## 2. 开关：只在预览网址开

1. 写一个 isQuizEnabled(request, env)：
   - env.QUIZ_PUBLIC 等于 "on" → 开（留给正式上线那天，这次不用）；
   - 否则只有主机名以 `-harborwish-site.williams60898.workers.dev` 结尾（分支和版本预览网址），或是 localhost、127.0.0.1 时才开；
   - 正式主机 harborwish-site.williams60898.workers.dev、harborwish.com、www.harborwish.com 一律关。
2. wrangler 配置的 vars 里加 QUIZ_PUBLIC = "off"。
3. 关着的时候：/test/ 返回网站现有的 404 页；/api/questions、/api/score 返回 404。不跳转、不提示。
4. /test/ 按需渲染（prerender = false），构建产物里不能有它的静态文件；不进 sitemap；响应头加 X-Robots-Tag: noindex。
5. 首页、导航、页脚一个字不改。
6. 先查清 Cloudflare 这个项目的预览用的是哪一种：新的 Previews（wrangler preview，后台有 Previews Base 设置）还是 Version URL（wrangler versions upload）。Williams 会在聊天里告诉你后台 Build 设置里预览命令写的是什么。如果是 Previews，按 Cloudflare 官方文档把 D1、限流、vars 的预览配置写进 previews 块（D1 指向同一个 harborwish-db），并告诉我还缺什么要 Williams 在后台补。

## 3. GET /api/questions

1. 顺序：开关 → 限流（第 6 节）→ 出题。
2. 按 engine.AXES 的顺序（valence、energy、control、social、time、clarity），每维 buildPool(key) → drawThree(pool)，rotation 和 exclude 都传空，共 18 道。buildPool、drawThree 用 questions.en.js 里原样的。
3. 每道题的 4 个选项，用 crypto.getRandomValues 做 Fisher–Yates 打乱；18 道题的先后顺序也同样打乱，不按维度排。
4. 发给浏览器的只有 `{ questions: [ { scene, options: [ { id, text } ×4 ] } ×18 ] }`。不发题号（valence-3 这种）、不发维度名、不发 score。
5. 响应头 Cache-Control: no-store。

## 4. POST /api/score

请求体：`{ answers: [18 个选项 id], turnstile: "<token>" }`

1. 顺序：开关 → 限流 → Turnstile（第 6 节）→ 校验答案 → 打分 → 签发凭证 → 记一笔匿名统计（第 7 节）→ 返回。
2. 校验。任何一条不过 → 400 `{ error: "invalid_answers" }`，不打分、不签凭证、不记统计：
   - answers 是数组，正好 18 个，都是字符串；
   - 每个 id 都能在 questions.en.js 里查到；
   - 18 个选项分属 18 道不同的题；
   - 每个维度正好 3 道。
3. 打分：由选项 id 在服务器端查出它的维度 key 和 score，组成 `{ valence:[a,b,c], energy:[…], control:[…], social:[…], time:[…], clarity:[…] }`，调用 scoring.computeResult(scoresByKey, ANIMALS_EN)。engine.js、scoring.js 的逻辑一点不改。
4. 中英对照，新文件 src/server/quiz/labels.en.js。按维度 key 和 highPole 取英文极词，不靠匹配中文字符串：

   | key | 低分极（bit 0） | 高分极（bit 1） | 中文（自检比对用） |
   | --- | --- | --- | --- |
   | valence | Cold | Warm | 冷 / 暖 |
   | energy | Low | High | 沉 / 烧 |
   | control | In Control | Carried Along | 主人 / 人质 |
   | social | Avoidant | Approaching | 独处 / 朝人 |
   | time | Past | Future | 回头 / 张望 |
   | clarity | Clear | Blurred | 看清 / 雾里 |

   档位代码：轻 → l，中 → m，重 → h。档位只进凭证，不上页面。
5. 返回 200：
   ```
   {
     animal: { slug, name, tagline },
     coordinates: [六个英文极词，按 valence → clarity 的顺序],
     safety: "negative" | "positive",   // valence 落在低分极（Cold）= negative
     chapter: true | false,             // 这个 slug 在 src/content/animals 里有内容文件
     token
   }
   ```
   不许返回：slot、code、bits、sum、folded、tier、highPole，任何分数、和、档位、字母编码。
6. 响应头 Cache-Control: no-store。出错只回错误代码，不回显请求内容。

## 5. 结果凭证（独立模块 src/server/result-token，JS 或 TS 跟仓库一致）

1. 导出 `issueResultToken({ animal, intensity }, env)` → `{ resultId, token }`，和 `verifyResultToken(token, env)` → payload 或 null。
2. resultId：16 字节，crypto.getRandomValues 生成，base64url（不带补位）。
3. payload：`{ v: 1, rid, animal, intensity, iat }`。
   - animal：slug。
   - intensity：六维各自的档，按 valence → clarity 顺序拼成 6 个字母，例如 "hmhhll"。整只动物取哪一档的规则阶段 9 再定，凭证格式不用改。
   - iat：签发时的 Unix 秒。
   - 不放分数、和、格位、编码。
4. token = base64url(payload 的 JSON) + "." + base64url(HMAC-SHA256(前一段))，密钥读 env.RESULT_SIGNING_KEY。验签用 crypto.subtle.verify（常数时间），不要自己逐字比较。
5. 没有密钥时，/api/score 返回 500 `{ error: "server_config" }`，日志只记 "RESULT_SIGNING_KEY missing"。
6. 这次只签发、不使用；阶段 9 结账直接调用 verifyResultToken。
7. 凭证只放在页面内存里：不进网址、hash、history；不写 cookie、localStorage、sessionStorage、IndexedDB；任何日志都不记录凭证、答案、请求体。

## 6. 防刷

1. Workers 限流绑定（wrangler 配置里的 ratelimits，wrangler 要 4.36 或以上；低于就只升级 wrangler 这一个包）：
   - SCORE_LIMITER：每个 IP 每 60 秒 10 次；
   - QUESTIONS_LIMITER：每个 IP 每 60 秒 30 次；
   - key 用 CF-Connecting-IP，只在内存里用，不记录、不入库；
   - 超限 → 429 `{ error: "rate_limited" }`。限流在 Turnstile 之前判断。
2. Cloudflare Turnstile：
   - 页面直接加载 https://challenges.cloudflare.com/turnstile/v0/api.js，不装 npm 包；
   - 后台 Williams 建的是 Managed 模式；页面用 appearance: "interaction-only"（需要人点一下时才出现），execution: "execute"（交卷那一刻才取 token）；
   - 站点密钥读 env.TURNSTILE_SITE_KEY，由服务器渲染进页面；
   - 服务器端用 env.TURNSTILE_SECRET_KEY 调 siteverify，不传 remoteip；success 不为 true，或返回的 hostname 不是本次请求的主机名 → 403 `{ error: "bot_check_failed" }`；siteverify 本身连不上 → 503 `{ error: "bot_check_unavailable" }`。
3. 本地开发用 .dev.vars（加进 .gitignore，不提交），配 Turnstile 官方测试密钥：站点 1x00000000000000000000AA；永远通过 1x0000000000000000000000000000000AA；永远失败 2x0000000000000000000000000000000AA。RESULT_SIGNING_KEY 本地随机生成一个，不提交。

## 7. 数据库：只此一张表

1. D1 绑定名 DB，database_name harborwish-db，database_id 由 Williams 在聊天里给（不是密钥，可以写进 wrangler 配置）。如果 wrangler 配置里已经有 D1 绑定，先告诉我，不要自己换。
2. 新建 migrations/0001_daily_animal_counts.sql：
   ```sql
   CREATE TABLE IF NOT EXISTS daily_animal_counts (
     day TEXT NOT NULL,
     animal TEXT NOT NULL,
     count INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (day, animal)
   );
   ```
   线上那份 Williams 已在 D1 控制台执行过；本地用 `wrangler d1 migrations apply DB --local`。
3. 每次成功打分后，用 ctx.waitUntil 执行：
   ```sql
   INSERT INTO daily_animal_counts (day, animal, count) VALUES (?1, ?2, 1)
   ON CONFLICT(day, animal) DO UPDATE SET count = count + 1;
   ```
   day 是 UTC 日期 YYYY-MM-DD，animal 是 slug。写失败只记 "stats write failed"，不影响返回结果；没有 DB 绑定时直接跳过。
4. 不建别的表。不存答案、IP、结果编号、凭证、精确时间、浏览器信息。

## 8. 页面 /test/（按需渲染，先过开关）

1. 开始页：大标题、说明三行、Start 按钮。点 Start 才请求 /api/questions。
2. 一题一屏：显示 scene 和 4 个选项按钮；进度「Question 3 of 18」加进度条；Back 回上一题改答案（第 1 题不显示 Back）。选完第 18 题自动交卷。
3. 交卷：显示 Finding your mood animal…，取 Turnstile token，POST /api/score。网址不变，不 push history。
4. 结果在同一页显示，从上到下：
   - Your mood animal right now
   - 有梗卡图的动物（现在 8 只），显示该只动物页上同一张图，alt 照动物页；没有的不放图
   - name（解读版名）和 tagline
   - Your Mood Moment · 日期（浏览器本地日期，en-US 长格式，例如 November 7, 2026）
   - chapter 为 true：嵌入该只动物页的免费章。必须和 /animals/{slug}/ 用同一份内容、同一个组件，不复制文字。具体怎么取（例如预渲染的局部页面，浏览器再取回）你提方案。
   - chapter 为 false：显示 Emotional coordinates: Cold · Low · In Control · …（中点分隔），下面一句 This animal's full chapter is on its way.；safety 为 negative 时再加安全块：小标题 If This Page Cuts Too Deep，接第 9 节两句固定句，最后接动物页现有的求助提示组件（988 和 findahelpline.com，和动物页同一个组件）。
   - Take it again 按钮：清掉内存里的题、答案和凭证，回到开始页。
5. 出错：按错误代码显示第 9 节对应的句子，留在当前位置，可以再交一次。
6. 页面上不出现：付费内容、解锁或购买按钮、价格、格位、字母编码、分数、档位。
7. 手机优先，按钮要大；用现有样式和字体，不新加字体和颜色。

## 9. 英文文字（逐字照用，不要改写）

| 位置 | 文字 |
| --- | --- |
| 浏览器标签标题 | Which Mood Animal Are You Right Now? \| Harborwish |
| 开始页大标题 | Which Mood Animal Are You Right Now? |
| 说明第一行 | 18 quick questions. No right or wrong answers. |
| 说明第二行 | Answer for right now, not for how you usually are. |
| 说明第三行（小字） | Your answers are scored on our server and never stored. No account needed. |
| 开始按钮 | Start |
| 进度 | Question {n} of 18 |
| 返回按钮 | Back |
| 交卷中 | Finding your mood animal… |
| 结果小标题 | Your mood animal right now |
| 情绪瞬间 | Your Mood Moment · {date} |
| 没有完整章时 | This animal's full chapter is on its way. |
| 重测按钮 | Take it again |
| 题目没加载出来 | The questions didn't load. Please refresh the page. |
| 429 | Too many tries in a row. Please wait a minute, then try again. |
| 403 | We couldn't confirm this is a real visit. Please try again. |
| 其他错误 | Something went wrong. Please try again. |

安全块两句固定句（英文版地基三件套锁定，一字不改）：

> What to watch for was never how loud the pain gets — it's the signal going quiet: needing less, reaching for no one, caring about less and less. That kind of calm needs to be seen by someone, more than any breakdown ever would.

> Go find the person who can catch you — a counselor or doctor, or the one person you trust enough to tell the truth. This isn't weakness. It's the most clear-eyed thing you can do for yourself right now.

撇号和引号用印刷体（’ “ ”），代码里照常。

## 10. CLAUDE.md 补这几条

1. src/server/quiz/ 和结果凭证模块只许服务器端接口引用。
2. 测试入口（/test/、/api/questions、/api/score）只在 isQuizEnabled 为真时存在；正式网址关着。改 QUIZ_PUBLIC 或开关逻辑要先问 Williams。
3. 接口不许返回格位、字母编码、分数、和、档位；题号和维度名不出服务器。
4. 不记录答案、请求体、凭证；不用 cookie 和任何浏览器存储。
5. 已同意的接口：GET /api/questions、POST /api/score；已同意的表：daily_animal_counts。再新增仍要先问。

## 11. 自检（每条都要实际跑；PR 描述里逐条贴命令和输出；跑不了的写明原因，不许写「应该没问题」）

1. 数据文件没动：engine.js、scoring.js 的 SHA-256 等于第 1 节两串；questions.en.js 相对 main 无改动（git diff 为空）。
2. 64 格全覆盖：对 64 种组合（每维 3 道全取 0 分或全取 3 分），用真 computeResult 和 ANIMALS_EN 计算：slot 1–64 各出现一次；结果的 slug、name 等于 animals.en.js 那一行；engine.codeOf(bits) 等于该行 code 去掉中点；src/content/animals 里现有 8 个内容文件的 slug 和名字，与 animals.en.js 对应行一致。
3. 四个锚点走真接口（本地 wrangler dev，POST /api/score，Turnstile 用永远通过的测试密钥），同时用 verifyResultToken 解出凭证核对 intensity：
   - 全选 0 分 → snow-leopard，intensity "hhhhhh"
   - 全选 3 分 → monkey，"hhhhhh"
   - 只 valence 三道全 3 分、其余全 0 分 → panda，"hhhhhh"
   - 混合：valence 3,3,2；energy 3,2,1；control 3,3,3；social 3,3,2；time 2,1,1；clarity 1,1,2 → corgi，"hmhhll"
4. 中英对照：labels.en.js 的中文列和 scoring.DIMENSIONS 的 low、high label 逐项相等（12 个）；档位三条齐。
5. /api/questions 连调 20 次：每次 18 道、每道 4 个选项；递归检查返回 JSON 的所有键名，只允许 questions、scene、options、id、text；服务器端查表统计，3 分选项落在第 1、2、3、4 位的次数各占 15%–35%；20 次的题目先后顺序互不相同。
6. 校验：下面 7 种请求都回 400、不带 token、统计表没有新增：17 个答案；19 个；同一选项出现两次；同一道题两个选项；某维 4 道、另一维 2 道；含一个不存在的 id；answers 不是数组。
7. 凭证：签发后验签通过；改 payload 一个字符、改签名一个字符、换一把密钥，验签都失败；payload 只有 v、rid、animal、intensity、iat 五个键；rid 解码后正好 16 字节；连签 1,000 张，rid 无重复；去掉密钥时 /api/score 回 500 server_config。
8. 开关：对 isQuizEnabled 和三个路由，用主机名 harborwish-site.williams60898.workers.dev、harborwish.com、www.harborwish.com 测 → 404；用 abc-harborwish-site.williams60898.workers.dev 测 → /test/ 和 /api/questions 200；QUIZ_PUBLIC 临时设 on 时正式主机也 200（测完改回 off）。构建产物里没有 /test/ 的静态文件；sitemap 里没有 /test/；打出首页 HTML 里主按钮那一行，仍是 Meet the 64 Mood Animals。
9. 限流：本地连续 100 次 POST /api/score，贴状态码统计：第 11 次起应全是 429。本地模拟不支持限流绑定的话写明，改在预览网址上跑（不带 Turnstile token，前 10 次 403，之后 429）。
10. Turnstile：用永远失败的测试密钥 → 403 bot_check_failed、不带 token；用永远通过的 → 200。
11. 统计表：跑完以上后查本地 D1：业务表只有 daily_animal_counts（d1_migrations 这类系统表除外），列只有 day、animal、count；count 总和等于成功打分的次数。
12. 构建产物（npm run build 后，只查发给浏览器的静态资源和 HTML，不查服务器端包）：搜不到 questions.en.js 里任挑 5 道题的题干；搜不到 OPTION_SCORE、tierOf、isHighPole、scoreDimension、slotOf、computeResult、buildPool、drawThree、RESULT_SIGNING_KEY、TURNSTILE_SECRET_KEY；Your Undercurrent、Your Relationships、Your Trap、Your Way Out 只允许出现在 /sample-report/ 那一页已有的例外里。贴 grep 命令和结果。
13. 浏览器端代码里搜不到 document.cookie、localStorage、sessionStorage、indexedDB、history.pushState、history.replaceState，也没有往 location.hash 写东西；服务器端代码里没有打印请求体、answers、token 的语句。
14. 响应头：/api/questions、/api/score 带 Cache-Control: no-store；/test/ 带 X-Robots-Tag: noindex。
15. npm run build 和类型检查通过。

## 12. 交付

1. PR 标题：Stage 8: quiz on preview only。不合并，等 Williams。
2. PR 描述贴：改动文件清单、第 11 节自检表（命令和输出）、预览网址。
3. 推上去后预览网址出来了，先自己打开 /test/ 和 /api/questions 各看一次，确认能用再交给我。
