import type { CollectionEntry } from 'astro:content';
import { getVisibleEntries } from '@utils/content';
import { getPeopleMap, getPersonNames, type PersonData } from '@utils/people';

export type Resource = CollectionEntry<'resources'>;

export interface ResourceCardData {
  resource: Resource;
  contributorNames: string;
}

/**
 * Get all visible resources sorted by year (newest first), then alphabetically
 */
export async function getResources(): Promise<Resource[]> {
  const allResources = await getVisibleEntries('resources');

  return allResources.sort((a, b) => {
      if (b.data.year !== a.data.year) {
        return b.data.year - a.data.year;
      }
      return a.data.title.localeCompare(b.data.title);
    });
}

/**
 * Prepare a single resource for card rendering
 */
export async function prepareResourceCardData(
  resource: Resource,
  peopleMap?: Map<string, PersonData>
): Promise<ResourceCardData> {
  const contributorNames = resource.data.authors
    || await getPersonNames(resource.data.contributors, peopleMap);

  return {
    resource,
    contributorNames,
  };
}

/**
 * Prepare multiple resources for card rendering (single people fetch)
 */
export async function prepareResourcesCardData(
  resources: Resource[]
): Promise<ResourceCardData[]> {
  const peopleMap = await getPeopleMap();
  return Promise.all(
    resources.map((resource) => prepareResourceCardData(resource, peopleMap))
  );
}

/**
 * Format category for display (e.g., "case-study" -> "Case Study")
 */
export function formatCategory(category: string): string {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get resources by ID, in the order given (drafts are dropped outside
 * dev/preview, and unknown IDs are skipped)
 */
export async function getResourcesByIds(ids: string[]): Promise<Resource[]> {
  const resources = await getVisibleEntries('resources');
  return ids
    .map((id) => resources.find((resource) => resource.data.id === id))
    .filter((resource): resource is Resource => resource !== undefined);
}

/**
 * Serialize prepared card data for the ResourceItem React component
 */
export function serializeResourceCardData({
  resource,
  contributorNames,
}: ResourceCardData) {
  return {
    id: resource.id,
    title: resource.data.title,
    description: resource.data.description,
    category: resource.data.category,
    year: resource.data.year,
    tags: resource.data.tags,
    externalLinks: resource.data.externalLinks,
    contributorNames,
  };
}
