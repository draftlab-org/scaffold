import type { FilterConfig } from '@components/molecules/FilterBar';
import FilterBar from '@components/molecules/FilterBar';
import { useCallback, useEffect, useState } from 'react';

interface Article {
  slug: string;
  title: string;
  permalink: string;
  excerpt?: string;
  authors: string[];
  tags: string[];
  categories?: string[];
  publishedDate: string;
  heroImage?: string;
  status: 'draft' | 'published' | 'archived';
}

interface ArticlesFilteredGridProps {
  articles: Article[];
  categories: string[];
  tags: string[];
  authorMap: Record<string, string>;
  isDev: boolean;
}

export default function ArticlesFilteredGrid({
  articles,
  categories,
  tags,
  authorMap,
  isDev,
}: ArticlesFilteredGridProps) {
  const getInitialFilters = useCallback((): Record<string, string | null> => {
    const initial: Record<string, string | null> = {
      category: null,
      tag: null,
    };

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const category = params.get('category');
      const tag = params.get('tag');
      if (category) initial.category = category;
      if (tag) initial.tag = tag;
    }

    return initial;
  }, []);

  const [filters, setFilters] =
    useState<Record<string, string | null>>(getInitialFilters);

  // Sync URL on filter change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  const handleFilterChange = (key: string, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ category: null, tag: null });
  };

  const filterConfig: FilterConfig[] = [
    {
      key: 'category',
      label: 'Category',
      options: categories.map((cat) => ({ value: cat, label: cat })),
      placeholder: 'All Categories',
    },
    {
      key: 'tag',
      label: 'Tag',
      options: tags.map((tag) => ({ value: tag, label: tag })),
      placeholder: 'All Tags',
    },
  ];

  // Filter articles
  const filteredArticles = articles.filter((article) => {
    if (filters.category && !article.categories?.includes(filters.category)) {
      return false;
    }
    if (
      filters.tag &&
      !article.tags.some((t) => t.toLowerCase() === filters.tag?.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateStr));
  };

  const getAuthorNames = (authorIds: string[]) => {
    return authorIds
      .map((id) => authorMap[id])
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div>
      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        className="mb-8"
      />

      {filteredArticles.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg">
            No articles match your filters. Try adjusting your selection.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <div
              key={article.slug}
              className="card-bordered flex h-full flex-col overflow-hidden rounded-lg"
            >
              {article.heroImage && (
                <a href={`/articles/${article.slug}`} className="block">
                  <img
                    src={article.heroImage}
                    alt={article.title}
                    className="h-48 w-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </a>
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

                {/* Tags */}
                <div className="mb-3 flex flex-wrap gap-2">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="tag-base tag-primary tag-size-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h3 className="mb-3 line-clamp-2 text-xl font-semibold">
                  <a
                    href={`/articles/${article.slug}`}
                    className="transition-colors hover:text-secondary-600"
                  >
                    {article.title}
                  </a>
                </h3>

                {/* Metadata */}
                <div className="mb-4 space-y-1">
                  <p className="text-sm">
                    By {getAuthorNames(article.authors)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(article.publishedDate)}
                  </p>
                </div>

                <div className="grow" />

                {/* Read More */}
                <div className="mt-4">
                  <a
                    href={`/articles/${article.slug}`}
                    className="button-base button-outline button-size-sm w-full text-center"
                  >
                    Read Article
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
