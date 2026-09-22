import { buildSearchIndex } from '@utils/search';
import type { APIRoute } from 'astro';

/**
 * Lean, pre-built index for RichSearch: titles, URLs, thumbnails and
 * plain-text content. One request instead of one per collection, and none of
 * the raw collection data the client doesn't need.
 */
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await buildSearchIndex()), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
