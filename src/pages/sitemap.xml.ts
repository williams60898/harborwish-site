import type { APIRoute } from 'astro';
import { getAnimals, animalPath } from '../lib/animals';

export const GET: APIRoute = async ({ site }) => {
  const animals = await getAnimals();
  const paths = ['/', '/animals/', ...animals.map((a) => animalPath(a.id))];
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
