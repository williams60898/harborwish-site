import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE_NAME } from '../site.config.mjs';

export type Animal = CollectionEntry<'animals'>;

export const TOTAL_ANIMALS = 64;

/** All published animals, in the internal display order. */
export async function getAnimals(): Promise<Animal[]> {
  const animals = await getCollection('animals');
  for (const a of animals) {
    if (a.data.slug !== a.id) throw new Error(`Animal slug "${a.data.slug}" does not match file "${a.id}.md"`);
  }
  return animals.sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
}

/** Share image built by src/integrations/og-images.mjs (1200×630 JPG). */
export const ogImagePath = (id: string) => `/og/animals/${id}.jpg`;
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export const animalPath = (id: string) => `/animals/${id}/`;

/** Subtitle as used in the <title>: a trailing period is dropped; ? and ! are kept. */
const titleSubtitle = (subtitle: string) => subtitle.trim().replace(/\.$/, '');

export const animalTitle = (animal: Animal) =>
  `${animal.data.name} Personality — ${titleSubtitle(animal.data.subtitle)} | ${SITE_NAME}`;

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty'];

/** 0–99 as English words, e.g. 56 → "fifty-six". */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) throw new Error(`numberToWords: unsupported ${n}`);
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  return n % 10 ? `${t}-${ONES[n % 10]}` : t;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Eight are here. Fifty-six more are on their way." — null once all 64 exist. */
export function progressLine(count: number): string | null {
  const remaining = TOTAL_ANIMALS - count;
  if (remaining <= 0) return null;
  const here = count === 1 ? 'One is here.' : `${capitalize(numberToWords(count))} are here.`;
  const more =
    remaining === 1 ? 'One more is on its way.' : `${capitalize(numberToWords(remaining))} more are on their way.`;
  return `${here} ${more}`;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * In the "The Animals Nearest You" section of rendered HTML, link each neighbor's name at its
 * first appearance — only when that neighbor has a page in the collection. Returns the new HTML
 * and which neighbors were linked (for checks).
 */
export function linkNeighbors(
  html: string,
  neighbors: Animal['data']['neighbors'],
  existing: Set<string>,
): { html: string; linked: string[]; plain: string[] } {
  const marker = /<h2[^>]*>The Animals Nearest You<\/h2>/;
  const m = marker.exec(html);
  if (!m) throw new Error('Section "The Animals Nearest You" not found');
  const head = html.slice(0, m.index + m[0].length);
  let section = html.slice(m.index + m[0].length);
  const linked: string[] = [];
  const plain: string[] = [];
  for (const n of neighbors) {
    if (!existing.has(n.slug)) {
      plain.push(n.name);
      continue;
    }
    // Names contain only letters, spaces and hyphens, so they appear verbatim in the HTML text.
    const re = new RegExp(`(?<![\\w-])${escapeRegExp(n.name)}(?![\\w-])`);
    const hit = re.exec(section);
    if (!hit) throw new Error(`Neighbor name "${n.name}" not found in "The Animals Nearest You"`);
    section =
      section.slice(0, hit.index) +
      `<a href="${escapeAttr(animalPath(n.slug))}">${n.name}</a>` +
      section.slice(hit.index + n.name.length);
    linked.push(n.name);
  }
  return { html: head + section, linked, plain };
}

const CRISIS_HEADING = 'If This Page Cuts Too Deep';
const externalLink = (href: string, text: string) =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
/** Owner-approved help line, shown as the last paragraph of the crisis section. */
export const HELP_LINE_HTML =
  '<p class="help-line">If this section sounds like where you are right now, please don’t carry it alone. ' +
  `In the US, call or text ${externalLink('https://988lifeline.org', '988')}. ` +
  `Anywhere else, ${externalLink('https://findahelpline.com', 'findahelpline.com')} will show you a helpline in your country.</p>`;

/**
 * If the rendered body has an "If This Page Cuts Too Deep" section, append the help line as its
 * last paragraph (just before the next h2, or at the end). Bodies without that section are
 * returned unchanged, so "A Gentle Note" pages never get it.
 */
export function addHelpLine(html: string): { html: string; added: boolean } {
  const m = new RegExp(`<h2[^>]*>${escapeRegExp(CRISIS_HEADING)}</h2>`).exec(html);
  if (!m) return { html, added: false };
  const after = m.index + m[0].length;
  const next = html.indexOf('<h2', after);
  const end = next === -1 ? html.length : next;
  const insert = HELP_LINE_HTML + '\n';
  return { html: html.slice(0, end) + insert + html.slice(end), added: true };
}
