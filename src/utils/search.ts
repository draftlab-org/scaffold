import { getImage } from 'astro:assets';
import { getEntry } from 'astro:content';
import { getVisibleEntries } from '@utils/content';

/** One entry in the client-side search index (`/api/search.json`). */
export interface SearchIndexItem {
  id: string;
  name: string;
  url: string;
  /** Must match a category name in RichSearch's SEARCH_CATEGORIES */
  category: 'Pages' | 'People' | 'Articles' | 'Docs';
  imageUrl?: string;
  /** Plain text for full-text matching, capped at CONTENT_LIMIT characters */
  content?: string;
}

/** Keeps the index small; the start of a document is usually the most relevant. */
const CONTENT_LIMIT = 2000;

/** Strip markdown/MDX syntax, leaving plain text for search indexing. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^import\s+.*$/gm, '') // MDX imports
    .replace(/^export\s+.*$/gm, '') // MDX exports
    .replace(/```[\s\S]*?```/g, '') // fenced code blocks
    .replace(/<[^>]+>/g, '') // HTML/JSX tags
    .replace(/`([^`]*)`/g, '$1') // inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1') // links → keep text
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/^\s*[-*+]\s+/gm, '') // unordered list markers
    .replace(/^\s*\d+\.\s+/gm, '') // ordered list markers
    .replace(/^>\s+/gm, '') // blockquotes
    .replace(/^\|?[\s:|-]+\|?$/gm, '') // table separator rows
    .replace(/\|/g, ' ') // table cell pipes
    .replace(/---+/g, '') // horizontal rules
    .replace(/\s+/g, ' ') // normalise whitespace
    .trim();
}

const toContent = (parts: (string | undefined | null)[]) => {
  const text = stripMarkdown(parts.filter(Boolean).join('\n\n'));
  return text ? text.slice(0, CONTENT_LIMIT) : undefined;
};

/** Small webp thumbnail — results show images at 24px high. */
const thumbnail = async (image?: ImageMetadata) =>
  image
    ? (await getImage({ src: image, width: 96, format: 'webp' })).src
    : undefined;

/**
 * Builds the full search index. Drafts are never indexed, not even in dev:
 * search results should reflect what the live site shows.
 */
export async function buildSearchIndex(): Promise<SearchIndexItem[]> {
  const published = <T extends { data: { status?: string } }>(entry: T) =>
    entry.data.status !== 'draft';

  const [pages, people, articles, docs, site] = await Promise.all([
    getVisibleEntries('pages'),
    getVisibleEntries('people'),
    getVisibleEntries('articles'),
    getVisibleEntries('docs'),
    getEntry('site', 'config'),
  ]);

  const defaultImageUrl = await thumbnail(site?.data.defaultOgImage);

  const items = await Promise.all([
    // The home page lives at '/', not '/home'
    ...pages
      .filter((page) => published(page) && page.id !== 'home')
      .map(async (page): Promise<SearchIndexItem> => {
        const sections = page.data.sections ?? [];
        return {
          id: `page-${page.id}`,
          name: page.data.title,
          url: `/${page.id}`,
          category: 'Pages',
          imageUrl: (await thumbnail(page.data.heroImage)) ?? defaultImageUrl,
          content: toContent([
            page.data.description,
            ...sections.map((section) => {
              if (section.type === 'richText') return section.content;
              if (section.type === 'hero') return section.subtitle;
              return undefined;
            }),
          ]),
        };
      }),
    ...people.filter(published).map(
      async (person): Promise<SearchIndexItem> => ({
        id: `person-${person.id}`,
        name: person.data.name,
        url: `/people/${person.data.id}`,
        category: 'People',
        imageUrl: await thumbnail(person.data.headshot),
        content: toContent([person.data.title]),
      })
    ),
    ...articles.filter(published).map(
      async (article): Promise<SearchIndexItem> => ({
        id: `article-${article.id}`,
        name: article.data.title,
        url: `/articles/${article.id}`,
        category: 'Articles',
        imageUrl:
          (await thumbnail(article.data.heroImage)) ?? defaultImageUrl,
        content: toContent([article.body]),
      })
    ),
    ...docs.filter(published).map(
      async (doc): Promise<SearchIndexItem> => ({
        id: `doc-${doc.id}`,
        name: doc.data.title,
        url: `/docs/${doc.data.permalink}`,
        category: 'Docs',
        content: toContent([doc.data.description, doc.body]),
      })
    ),
  ]);

  return items;
}
