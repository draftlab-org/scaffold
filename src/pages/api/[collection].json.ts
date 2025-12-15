import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { collections } from '../../content/config';

// Get collection names from the config - single source of truth
const COLLECTION_NAMES = Object.keys(collections) as Array<
  keyof typeof collections
>;

export const GET: APIRoute = async ({ params }) => {
  const { collection } = params;

  if (!collection) {
    return new Response(
      JSON.stringify({ error: 'Collection name is required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Fetch all entries from the specified collection
    const entries = await getCollection(collection as keyof typeof collections);

    // Map entries to include both data and id/slug
    const collectionData = entries.map((entry) => {
      // For content collections (like articles), include the body
      if ('body' in entry) {
        return {
          id: entry.id,
          slug: 'slug' in entry ? entry.slug : entry.id,
          data: entry.data,
          body: entry.body,
        };
      }

      // For data collections (like pages, people), just return data with id
      return {
        id: entry.id,
        ...entry.data,
      };
    });

    // Special handling for categories collection - return as object instead of array
    if (collection === 'categories') {
      const categoriesObject = collectionData.reduce((acc: any, entry: any) => {
        acc[entry.id] = {
          ...entry,
          categories: entry.categories?.map((cat: string) => ({ name: cat })) || [],
        };
        return acc;
      }, {});

      return new Response(JSON.stringify(categoriesObject), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(collectionData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: `Collection '${collection}' not found or invalid`,
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export function getStaticPaths() {
  // Automatically generate paths from all collections in config
  return COLLECTION_NAMES.map((collection) => ({
    params: { collection },
  }));
}
