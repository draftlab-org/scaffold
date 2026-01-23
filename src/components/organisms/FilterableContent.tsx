import FilterBar, { type FilterConfig } from '@components/molecules/FilterBar';
import { type ReactNode, useCallback, useEffect, useState } from 'react';

interface FilterableContentProps<T> {
  items: T[];
  filterConfig: FilterConfig[];
  filterFn: (item: T, filters: Record<string, string | null>) => boolean;
  children: (filteredItems: T[]) => ReactNode;
  syncToUrl?: boolean;
  className?: string;
}

export default function FilterableContent<T>({
  items,
  filterConfig,
  filterFn,
  children,
  syncToUrl = true,
  className = '',
}: FilterableContentProps<T>) {
  // Initialize filter values from URL if syncToUrl is enabled
  const getInitialFilters = useCallback((): Record<string, string | null> => {
    const initial: Record<string, string | null> = {};

    filterConfig.forEach((filter) => {
      initial[filter.key] = null;
    });

    if (syncToUrl && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      filterConfig.forEach((filter) => {
        const value = params.get(filter.key);
        if (value) {
          initial[filter.key] = value;
        }
      });
    }

    return initial;
  }, [filterConfig, syncToUrl]);

  const [filters, setFilters] = useState<Record<string, string | null>>(
    getInitialFilters
  );

  // Sync URL on filter change
  useEffect(() => {
    if (!syncToUrl || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    // Update params based on current filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Update URL without reload
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, [filters, syncToUrl]);

  // Handle popstate for browser back/forward
  useEffect(() => {
    if (!syncToUrl || typeof window === 'undefined') return;

    const handlePopState = () => {
      setFilters(getInitialFilters());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncToUrl, getInitialFilters]);

  const handleFilterChange = (key: string, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    const cleared: Record<string, string | null> = {};
    filterConfig.forEach((filter) => {
      cleared[filter.key] = null;
    });
    setFilters(cleared);
  };

  // Apply filters
  const filteredItems = items.filter((item) => filterFn(item, filters));

  return (
    <div className={className}>
      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        className="mb-8"
      />

      {children(filteredItems)}
    </div>
  );
}
