// Share images (og:image) for animal pages: each poster fitted in the middle of a
// 1200×630 canvas in the brand background colour, saved as JPG (owner-approved; social
// platforms don't all accept webp). Generated with sharp at build time, outside the
// Workers runtime, into dist/client/og/animals/{slug}.jpg. The dev server renders them on request.
import { readdir, mkdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const CANVAS = '#FAF4EA';
const PAD = 24;
// Keep in sync with ogImagePath() in src/lib/animals.ts.
const PREFIX = '/og/animals/';

async function render(posterPath) {
  const poster = await sharp(posterPath)
    .resize({ height: OG_HEIGHT - PAD * 2, fit: 'inside' })
    .png()
    .toBuffer();
  return sharp({ create: { width: OG_WIDTH, height: OG_HEIGHT, channels: 3, background: CANVAS } })
    .composite([{ input: poster, gravity: 'center' }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

export default function ogImages() {
  let root;
  const contentDir = () => path.join(root, 'src/content/animals');
  const posterFor = (slug) => path.join(root, 'src/assets/animals', `${slug}.png`);

  return {
    name: 'harborwish:og-images',
    hooks: {
      'astro:config:setup': ({ config }) => {
        root = fileURLToPath(config.root);
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const m = req.url && req.url.startsWith(PREFIX) && /^\/og\/animals\/([a-z-]+)\.jpg$/.exec(req.url);
          if (!m) return next();
          try {
            const buf = await render(posterFor(m[1]));
            res.setHeader('Content-Type', 'image/jpeg');
            res.end(buf);
          } catch {
            next();
          }
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const out = path.join(fileURLToPath(dir), 'og/animals');
        await mkdir(out, { recursive: true });
        const slugs = (await readdir(contentDir())).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
        for (const slug of slugs) {
          const src = posterFor(slug);
          await access(src); // fail the build if a poster is missing
          await writeFile(path.join(out, `${slug}.jpg`), await render(src));
        }
        logger.info(`wrote ${slugs.length} share images to ${PREFIX}`);
      },
    },
  };
}
