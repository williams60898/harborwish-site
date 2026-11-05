import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Public fields only. Scoring rules and paid sections never live in this collection —
// everything here is shipped to the browser as static HTML.
const animals = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/animals' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      subtitle: z.string(),
      // Plain display text. No letter codes or internal numbers (see CLAUDE.md).
      quadrant: z.string(),
      // Hand-written meta description.
      description: z.string().max(155),
      neighbors: z.array(reference('animals')).default([]),
      illustration: image(),
      illustrationAlt: z.string().min(1),
      illustrationCaption: z.string().min(1),
    }),
});

export const collections = { animals };
