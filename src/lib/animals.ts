import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE_NAME } from '../site.config.mjs';

export type Animal = CollectionEntry<'animals'>;

export async function getAnimals(): Promise<Animal[]> {
  const animals = await getCollection('animals');
  return animals.sort((a, b) => a.data.name.localeCompare(b.data.name));
}

export const animalPath = (id: string) => `/animals/${id}/`;

export const animalTitle = (animal: Animal) =>
  `${animal.data.name} Personality — ${animal.data.subtitle} | ${SITE_NAME}`;
