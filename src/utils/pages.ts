import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';
import { isVisible } from '@utils/content';

export type Page = CollectionEntry<'pages'>;

/**
 * Fetches and filters pages based on status and environment.
 * In production, only published/archived pages are returned.
 * In development/preview, all pages are returned.
 */
export async function getPages(): Promise<Page[]> {
  const allPages = await getCollection('pages');
  return allPages.filter((page) => isVisible(page));
}
