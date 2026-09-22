import type { CollectionEntry } from 'astro:content';
import { getVisibleEntries } from '@utils/content';
import type { ImageMetadata } from 'astro';

export type Partner = CollectionEntry<'partners'>['data'];

/**
 * Get all visible partners from the collection, sorted by order
 */
export async function getAllPartners(): Promise<Partner[]> {
  const entries = await getVisibleEntries('partners');
  return entries
    .map((entry) => entry.data)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

/**
 * Get all unique categories from partners
 */
export async function getAllCategories(): Promise<string[]> {
  const partners = await getAllPartners();
  const categories = new Set<string>();
  for (const partner of partners) {
    for (const category of partner.category) categories.add(category);
  }
  return Array.from(categories).sort();
}

/**
 * Get the URL for a partner's detail page
 */
export function getPartnerUrl(partner: Partner): string {
  return `/partners/${partner.id}`;
}

/**
 * Human-readable list of a partner's categories, e.g. "Sponsor, Media"
 */
export function formatPartnerCategories(partner: Pick<Partner, 'category'>) {
  return partner.category
    .map((category) => category.charAt(0).toUpperCase() + category.slice(1))
    .join(', ');
}

/**
 * Logo dimensions that fit inside a box while keeping the logo's own aspect
 * ratio. Passing the box size straight to <Image> would crop logos that
 * don't share its ratio; this scales them to fit instead, never past their
 * natural size.
 */
export function fitLogo(
  image: ImageMetadata,
  box: { width: number; height: number } = { width: 200, height: 128 }
) {
  if (!image.width || !image.height) return box;
  const scale = Math.min(box.width / image.width, box.height / image.height, 1);
  return {
    width: Math.round(image.width * scale),
    height: Math.round(image.height * scale),
  };
}
