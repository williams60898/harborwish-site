import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Public fields only. Scoring rules and paid sections never live in this collection —
// everything here is shipped to the browser as static HTML.
const animals = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/animals' }),
  schema: ({ image }) =>
    z.object({
      // Internal display order for list pages. Never rendered.
      order: z.number().int().positive(),
      // URL slug; must match the file name.
      slug: z.string().regex(/^[a-z]+(-[a-z]+)*$/),
      // Used for the page title and H1.
      name: z.string().min(1),
      subtitle: z.string().min(1),
      // First-person pull quote.
      voice: z.string().min(1),
      // The six dimensions, shown as one line.
      coordinates: z.array(z.string().min(1)).length(6),
      // Plain display text (for example "Cold · Low"). Kept as data; not rendered for now.
      quadrant: z.string().min(1),
      // Hand-written meta description.
      description: z.string().max(155),
      image: image(),
      image_alt: z.string().min(1),
      // Only ever used inside image_alt / og:image:alt. Never shown as visible text.
      meme_card_name: z.string().min(1),
      neighbors: z
        .array(
          z.object({
            slug: z.string().min(1),
            name: z.string().min(1),
            // Editorial note only. Links are decided from the collection at build time.
            page_ready: z.boolean().optional(),
          }),
        )
        .default([]),
    }),
});

export const collections = { animals };
