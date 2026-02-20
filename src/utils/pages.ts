import type { CollectionEntry } from 'astro:content';
import { getVisibleEntries } from '@utils/content';

export type Page = CollectionEntry<'pages'>;

/**
 * Fetches and filters pages based on status and environment.
 * In production, only published/archived pages are returned.
 * In development/preview, all pages are returned.
 */
export async function getPages(): Promise<Page[]> {
  return getVisibleEntries('pages');
}
