import FilterableContent, {
  type FilterField,
  type SearchConfig,
  type SortOption,
} from '@components/organisms/FilterableContent';
import type { CardImage } from '@utils/images';
import { useMemo } from 'react';

interface Article {
  slug: string;
  title: string;
  permalink: string;
  excerpt?: string;
  authors: string[];
  categories?: string[];
  publishedDate: string;
  heroImage?: CardImage;
  status: 'draft' | 'published' | 'archived';
}

interface ArticlesFilteredGridProps {
  articles: Article[];
  categories: string[];
  authorMap: Record<string, string>;
  isDev: boolean;
}

const byDate = (a: Article, b: Article) =>
  new Date(a.publishedDate).getTime() - new Date(b.publishedDate).getTime();

const sortOptions: SortOption<Article>[] = [
  { value: 'newest', label: 'Newest first', compare: (a, b) => byDate(b, a) },
  { value: 'oldest', label: 'Oldest first', compare: byDate },
  {
    value: 'title',
    label: 'Title (A–Z)',
    compare: (a, b) => a.title.localeCompare(b.title),
  },
];

const search: SearchConfig = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'excerpt', weight: 1 },
    { name: 'authorNames', weight: 1 },
  ],
  placeholder: 'Search articles…',
};

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));

export default function ArticlesFilteredGrid({
  articles,
  categories,
  authorMap,
  isDev,
}: ArticlesFilteredGridProps) {
  // Resolve author names once, so they can be searched and displayed
  const items = useMemo(
    () =>
      articles.map((article) => ({
        ...article,
        authorNames: article.authors
          .map((id) => authorMap[id])
          .filter(Boolean)
          .join(', '),
      })),
    [articles, authorMap]
  );

  const filterFields = useMemo<FilterField<(typeof items)[number]>[]>(
    () => [
      {
        key: 'category',
        label: 'Category',
        options: categories.map((cat) => ({ value: cat, label: cat })),
        placeholder: 'All Categories',
        multiple: true,
        getValue: (article) => article.categories,
      },
    ],
    [categories]
  );

  return (
    <FilterableContent
      items={items}
      filterFields={filterFields}
      search={search}
      sortOptions={sortOptions}
      itemLabel={{ singular: 'article', plural: 'articles' }}
      emptyMessage="No articles have been published yet. Check back soon!"
      noResultsMessage="No articles match your filters."
    >
      {(filteredArticles) => (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <div
              key={article.slug}
              className="card-bordered flex h-full flex-col overflow-hidden rounded-lg"
            >
              {article.heroImage && (
                // Decorative: the title below is the card's link
                <div className="overflow-hidden">
                  <img
                    src={article.heroImage.src}
                    width={article.heroImage.width}
                    height={article.heroImage.height}
                    alt=""
                    className="h-48 w-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="flex h-full flex-col p-6">
                {/* Draft badge */}
                {isDev && article.status === 'draft' && (
                  <div className="mb-3">
                    <span className="tag-base tag-highlight tag-size-sm font-bold">
                      DRAFT
                    </span>
                  </div>
                )}

                {/* Categories */}
                {article.categories && article.categories.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {article.categories.slice(0, 2).map((category) => (
                      <span
                        key={category}
                        className="tag-base tag-primary tag-size-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h3 className="text-xl font-bold md:text-2xl">
                  <a
                    href={`/articles/${article.slug}`}
                    className="text-inherit no-underline transition-colors hover:text-secondary-600"
                  >
                    {article.title}
                  </a>
                </h3>

                {/* Metadata */}
                <div className="mb-4 space-y-1 text-sm text-faint">
                  {article.authorNames && <p>By {article.authorNames}</p>}
                  <p>{formatDate(article.publishedDate)}</p>
                </div>

                {article.excerpt && (
                  <p className="line-clamp-3 text-muted">{article.excerpt}</p>
                )}

                <div className="grow" />
              </div>
            </div>
          ))}
        </div>
      )}
    </FilterableContent>
  );
}
