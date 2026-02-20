import type { CollectionEntry } from 'astro:content';
import { getVisibleEntries } from '@utils/content';

export type Partner = CollectionEntry<'partners'>['data'];

/**
 * Get all visible partners from the collection, sorted by order
 */
export async function getAllPartners(): Promise<Partner[]> {
  const entries = await getVisibleEntries('partners');
  return entries
    .map((entry) => entry.data)
    .sort((a, b) => (a.order || 999) - (b.order || 999));
}

/**
 * Get all unique categories from partners
 */
export async function getAllCategories(): Promise<string[]> {
  const partners = await getAllPartners();
  const categories = new Set<string>();
  for (const partner of partners) {
    categories.add(partner.category);
  }
  return Array.from(categories).sort();
}

/**
 * Get the URL for a partner's detail page
 */
export function getPartnerUrl(partner: Partner): string {
  return `/partners/${partner.id}`;
}
