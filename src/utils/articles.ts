import { type CollectionEntry, getCollection } from 'astro:content';
import { isDev } from './dev';

export type Article = CollectionEntry<'articles'>;

/**
 * Get all published articles (includes drafts in dev mode)
 */
export async function getPublishedArticles(): Promise<Article[]> {
  const allArticles = await getCollection('articles');
  return allArticles.filter(
    (article) => isDev || article.data.published === 'published'
  );
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
 * Get articles filtered by tag
 */
export async function getArticlesByTag(tag: string): Promise<Article[]> {
  const articles = await getPublishedArticles();
  return articles.filter((article) =>
    article.data.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * Get related articles based on shared tags and categories
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

  // Otherwise, find related articles by tags and categories
  const articleTags = new Set(article.data.tags.map((t) => t.toLowerCase()));
  const articleCategories = new Set(article.data.categories || []);

  const scoredArticles = allArticles
    .filter(
      (a) =>
        a.id !== article.id && !explicitRelated.some((r) => r.id === a.id)
    )
    .map((a) => {
      let score = 0;
      // Score based on shared tags
      a.data.tags.forEach((tag) => {
        if (articleTags.has(tag.toLowerCase())) score += 2;
      });
      // Score based on shared categories
      a.data.categories?.forEach((cat) => {
        if (articleCategories.has(cat)) score += 3;
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

  articles.forEach((article) => {
    article.data.categories?.forEach((cat) => categories.add(cat));
  });

  return Array.from(categories).sort();
}

/**
 * Get all unique tags from articles
 */
export async function getAllTags(): Promise<string[]> {
  const articles = await getPublishedArticles();
  const tags = new Set<string>();

  articles.forEach((article) => {
    article.data.tags.forEach((tag) => tags.add(tag));
  });

  return Array.from(tags).sort();
}

/**
 * Format a date for display
 */
export function formatArticleDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Get the URL for an article
 */
export function getArticleUrl(article: Article): string {
  return `/articles/${article.slug}`;
}
