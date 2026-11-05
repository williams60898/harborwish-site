# Stage 3 brief: eight sample animal pages

Read this together with CLAUDE.md. CLAUDE.md wins if they conflict. Before you change anything, tell me your plan in a short list and wait for my OK.

## Inputs (in this folder)

- `animals/*.md`: eight content files (snow-leopard, polar-bear, pufferfish, hedgehog, panda, capybara, cheetah, dolphin). Front matter plus the free chapter only.
- `posters/*.png`: one meme-card poster per animal, same file name as the slug (1086×1448, about 2.5–3 MB each). If any of the eight is missing, stop and tell me.

## Content rules

1. Use the text exactly as written. Do not rewrite, shorten, "fix" wording or add sentences. `*...*` is italics and must render as italics.
2. These files contain free content only. Never add any paid section (Your Undercurrent, Your Relationships, Your Trap, Your Way Out, Your Intensity) to any public page.
3. The page title and H1 always use `name` (for example The Gazing Snow Leopard). `meme_card_name` is used only inside `image_alt` and `og:image:alt`. Do not show it as visible text anywhere.
4. Do not show internal numbers, slot positions, letter codes or band names. `quadrant` may appear as a small plain label (for example "Cold · Low") with no link; there are no quadrant pages yet.
5. Move the files into the site's content collection and extend the existing schema from stage 1 as needed. Replace the placeholder snow leopard page.

## Animal page layout (/animals/{slug}/)

In this order:

1. H1 `name`, then `subtitle`.
2. `voice` as a first-person pull quote, wrapped in “ ”.
3. The poster: `image_alt` as alt text, explicit width and height, loaded eagerly (it is the main image), about 480 px wide on desktop and full width on mobile.
4. The six `coordinates` as one line, separated by " · ".
5. The body sections from the file, in order: Your Six Dimensions, Your Portrait (its closing blockquote styled as a pull quote), then either "If This Page Cuts Too Deep" or "A Gentle Note", then The Animals Nearest You.
6. Neighbor links: in The Animals Nearest You, link each neighbor's name at its first appearance in the text, but only if a page for that neighbor's slug exists in the content collection. If not, leave the name as plain text. Decide this at build time from the collection, not from `page_ready` (that field is only a note), so names become links by themselves when later batches go live.
7. At the bottom, the main button "Meet the 64 Mood Animals" linking to /animals/.

## Images

- Produce webp through Astro's image pipeline (place the PNGs wherever it needs them, for example src/assets/animals/). Responsive widths around 400, 800 and 1086 px, quality about 80. Only webp is shipped; no PNG in dist/.
- Lazy-load the posters on list pages (directory and home cards); eager on each animal's own page.
- Share preview: og:image from the poster (a 1200×630 version on the canvas color #FAF4EA with the poster fitted in the middle is ideal), with og:image:alt = `image_alt`.
- Do not delete anything in docs/stage3/. Ask me first if you think something should be deleted.

## Directory page (/animals/) and home page

- /animals/: one card per animal in the collection (poster thumbnail, `name`, `subtitle`, link). Order for this batch: snow-leopard, polar-bear, pufferfish, hedgehog, panda, capybara, cheetah, dolphin. Keep the order in an internal field that is never rendered.
- Under the grid, one line, computed from how many pages exist: "Eight are here. Fifty-six more are on their way." Write the numbers as words, so it updates itself with each batch. When all 64 exist, hide the line.
- Home page, section "Start with a few": the same eight cards.

## SEO (per CLAUDE.md)

- Title format from CLAUDE.md; meta description = `description` (already ≤155 characters, use as is).
- Exactly one H1 per page. Canonical https://harborwish.com/animals/{slug}/ (site URL is https://harborwish.com even while we are on workers.dev).
- JSON-LD: Article, BreadcrumbList (Home › Mood Animals › name), WebSite. Organization with name Harborwish and the site URL only; no legal company name on these pages.
- sitemap.xml covering all public pages, and robots.txt that allows all crawlers and points to https://harborwish.com/sitemap.xml.

## Checks to run before you open the PR, and report as one table

1. For each of the 8 pages: title, description length, number of H1s, which neighbor names are links and which are plain text, poster file size at 800w.
2. Search the built HTML of /animals/ pages and the home page for: Your Undercurrent, Your Relationships, Your Trap, Your Way Out, Your Intensity, LURK, STORM, COZY, SURF, N·, P·, China, Douyin, Shenyang. Expected: zero hits.
3. Each meme_card_name appears only in alt and og:image:alt attributes.
4. No 404s from any link on the 8 pages, the directory or home.
5. Page width at 375 px: no sideways scrolling.
6. Footer still shows the "Not a diagnostic tool" statement and the AI illustration note on the animal pages.

Then open a pull request, give me the preview URL, and do not merge.
