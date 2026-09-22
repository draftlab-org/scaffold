import type { CollectionEntry } from 'astro:content';
import { getVisibleEntries } from '@utils/content';
import { getExcerpt } from '@utils/excerpt';

export type Article = CollectionEntry<'articles'>;

/**
 * Get all published articles (includes drafts in dev/preview mode)
 */
export async function getPublishedArticles(): Promise<Article[]> {
  return getVisibleEntries('articles');
}

/**
 * Get articles filtered by category
 */
export async function getArticlesByCategory(
  category: string
): Promise<Article[]> {
  const articles = await getPublishedArticles();
  return articles.filter((article) =>
    article.data.categories?.includes(category as any)
  );
}

/**
 * Get related articles based on shared categories
 */
export async function getRelatedArticles(
  article: Article,
  limit: number = 3
): Promise<Article[]> {
  const allArticles = await getPublishedArticles();

  // First, check for explicitly defined related articles
  const explicitRelated: Article[] = [];
  if (article.data.relatedArticles && article.data.relatedArticles.length > 0) {
    for (const permalink of article.data.relatedArticles) {
      const related = allArticles.find((a) => a.data.permalink === permalink);
      if (related && related.id !== article.id) {
        explicitRelated.push(related);
      }
    }
  }

  // If we have enough explicit related articles, return them
  if (explicitRelated.length >= limit) {
    return explicitRelated.slice(0, limit);
  }

  // Otherwise, find related articles by shared categories
  const articleCategories = new Set(article.data.categories || []);

  const scoredArticles = allArticles
    .filter(
      (a) =>
        a.id !== article.id && !explicitRelated.some((r) => r.id === a.id)
    )
    .map((a) => {
      let score = 0;
      a.data.categories?.forEach((cat) => {
        if (articleCategories.has(cat)) score += 1;
      });
      return { article: a, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const remainingSlots = limit - explicitRelated.length;
  const additionalRelated = scoredArticles
    .slice(0, remainingSlots)
    .map((item) => item.article);

  return [...explicitRelated, ...additionalRelated];
}

/**
 * Sort articles by date
 */
export function sortArticlesByDate(
  articles: Article[],
  order: 'asc' | 'desc' = 'desc'
): Article[] {
  return [...articles].sort((a, b) => {
    const dateA = a.data.publishedDate.getTime();
    const dateB = b.data.publishedDate.getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Get all unique categories from articles
 */
export async function getAllCategories(): Promise<string[]> {
  const articles = await getPublishedArticles();
  const categories = new Set<string>();

  for (const article of articles) {
    for (const cat of article.data.categories ?? []) {
      categories.add(cat);
    }
  }

  return Array.from(categories).sort();
}

/**
 * Format a date for display
 */
export function formatArticleDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Get the URL for an article
 */
export function getArticleUrl(article: Article): string {
  return `/articles/${article.id}`;
}

/**
 * Get articles by permalink, in the order given (drafts are dropped outside
 * dev/preview, and unknown permalinks are skipped)
 */
export async function getArticlesByPermalinks(
  permalinks: string[]
): Promise<Article[]> {
  const articles = await getPublishedArticles();
  return permalinks
    .map((permalink) => articles.find((a) => a.data.permalink === permalink))
    .filter((article): article is Article => article !== undefined);
}

/**
 * The article's excerpt, falling back to one generated from its body
 */
export function getArticleExcerpt(
  article: Article,
  maxLength?: number
): string | undefined {
  return article.data.excerpt || getExcerpt(article.body, maxLength);
}
