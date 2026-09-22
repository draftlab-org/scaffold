import FilterBar, { type FilterConfig } from '@components/molecules/FilterBar';
import Fuse, { type IFuseOptions } from 'fuse.js';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// A dropdown filter plus how to read an item's value(s) for it. An item
// matches when any of its values is among the selected ones; separate filters
// combine with AND.
export interface FilterField<T> extends FilterConfig {
  getValue: (item: T) => string | string[] | null | undefined;
}

// A sort choice. The first option is the default; omit `compare` to keep the
// order the items were given in.
export interface SortOption<T> {
  value: string;
  label: string;
  compare?: (a: T, b: T) => number;
}

export interface SearchConfig {
  // Fuse.js keys (dot paths into the item), optionally weighted
  keys: IFuseOptions<unknown>['keys'];
  label?: string;
  placeholder?: string;
}

export interface FilterState {
  values: Record<string, string[]>;
  query: string;
  sort: string;
  // True when any filter or search is active
  isFiltered: boolean;
}

interface FilterableContentProps<T> {
  items: T[];
  filterFields?: FilterField<T>[];
  search?: SearchConfig;
  sortOptions?: SortOption<T>[];
  children: (filteredItems: T[], state: FilterState) => ReactNode;
  // Used in the result count, e.g. { singular: 'article', plural: 'articles' }
  itemLabel?: { singular: string; plural: string };
  // Shown when there are no items at all (nothing published yet)
  emptyMessage?: ReactNode;
  // Shown when items exist but none match the current filters
  noResultsMessage?: ReactNode;
  syncToUrl?: boolean;
  className?: string;
}

const SEARCH_PARAM = 'q';
const SORT_PARAM = 'sort';

function toArray(value: string | string[] | null | undefined): string[] {
  if (value == null || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

export default function FilterableContent<T>({
  items,
  filterFields = [],
  search,
  sortOptions = [],
  children,
  itemLabel = { singular: 'item', plural: 'items' },
  emptyMessage = 'Nothing has been published here yet. Check back soon!',
  noResultsMessage = 'Nothing matches your filters. Try adjusting your selection.',
  syncToUrl = true,
  className = '',
}: FilterableContentProps<T>) {
  // The key set is snapshotted once on mount — only the *values* are
  // expected to change across renders, not which filters exist.
  const filterKeysRef = useRef(filterFields.map((field) => field.key));
  const sortValuesRef = useRef(sortOptions.map((option) => option.value));
  const defaultSort = sortOptions[0]?.value ?? '';
  // Don't write to the URL until the URL's own state has been applied
  const urlAppliedRef = useRef(false);

  const emptyValues = useCallback(() => {
    const initial: Record<string, string[]> = {};
    for (const key of filterKeysRef.current) initial[key] = [];
    return initial;
  }, []);

  // Start from the empty state so the client's first render matches the
  // server-rendered HTML (which can't see the query string), then apply the
  // URL's state once mounted. Reading window.location during the initial
  // render causes a hydration mismatch.
  const [values, setValues] =
    useState<Record<string, string[]>>(emptyValues);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(defaultSort);

  const applyStateFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const next: Record<string, string[]> = {};
    for (const key of filterKeysRef.current) {
      next[key] = params.getAll(key).filter(Boolean);
    }
    setValues(next);
    setQuery(params.get(SEARCH_PARAM) ?? '');
    const urlSort = params.get(SORT_PARAM);
    setSort(
      urlSort && sortValuesRef.current.includes(urlSort)
        ? urlSort
        : (sortValuesRef.current[0] ?? '')
    );
  }, []);

  useEffect(() => {
    if (!syncToUrl) return;
    applyStateFromUrl();
  }, [syncToUrl, applyStateFromUrl]);

  // Sync URL on state change
  useEffect(() => {
    if (!syncToUrl) return;
    // Skip the first run: state is still the empty initial value and would
    // wipe the query string before it has been applied.
    if (!urlAppliedRef.current) {
      urlAppliedRef.current = true;
      return;
    }

    const params = new URLSearchParams(window.location.search);

    for (const [key, selected] of Object.entries(values)) {
      params.delete(key);
      for (const value of selected) params.append(key, value);
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery) params.set(SEARCH_PARAM, trimmedQuery);
    else params.delete(SEARCH_PARAM);

    if (sort && sort !== sortValuesRef.current[0]) params.set(SORT_PARAM, sort);
    else params.delete(SORT_PARAM);

    // Update URL without reload. Keep the existing history state (Astro's
    // ClientRouter stores its index and scroll position there) and the hash.
    const search = params.toString();
    const newUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;

    window.history.replaceState(window.history.state, '', newUrl);
  }, [values, query, sort, syncToUrl]);

  // Handle popstate for browser back/forward
  useEffect(() => {
    if (!syncToUrl) return;
    window.addEventListener('popstate', applyStateFromUrl);
    return () => window.removeEventListener('popstate', applyStateFromUrl);
  }, [syncToUrl, applyStateFromUrl]);

  const handleFilterChange = (key: string, selected: string[]) => {
    setValues((prev) => ({ ...prev, [key]: selected }));
  };

  const handleClearFilters = () => {
    setValues(emptyValues());
    setQuery('');
  };

  const fuse = useMemo(
    () =>
      search
        ? new Fuse(items, {
            keys: search.keys,
            threshold: 0.35,
            ignoreLocation: true,
          })
        : null,
    [items, search]
  );

  const trimmedQuery = query.trim();
  const isFiltered =
    trimmedQuery !== '' ||
    Object.values(values).some((selected) => selected.length > 0);

  const filteredItems = useMemo(() => {
    // Text search first: with the default sort, results stay in relevance order
    const searched =
      fuse && trimmedQuery
        ? fuse.search(trimmedQuery).map((result) => result.item)
        : items;

    const matching = searched.filter((item) =>
      filterFields.every((field) => {
        const selected = values[field.key] ?? [];
        if (selected.length === 0) return true;
        const itemValues = toArray(field.getValue(item));
        return itemValues.some((value) => selected.includes(value));
      })
    );

    const sortOption = sortOptions.find((option) => option.value === sort);
    const keepRelevance = trimmedQuery !== '' && sort === defaultSort;
    if (!sortOption?.compare || keepRelevance) return matching;
    return [...matching].sort(sortOption.compare);
  }, [
    fuse,
    trimmedQuery,
    items,
    filterFields,
    values,
    sortOptions,
    sort,
    defaultSort,
  ]);

  const count = filteredItems.length;
  const statusText = `Showing ${count} of ${items.length} ${
    items.length === 1 ? itemLabel.singular : itemLabel.plural
  }`;

  if (items.length === 0) {
    return (
      <div className={`py-12 text-center ${className}`}>
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <FilterBar
        filters={filterFields}
        values={values}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        searchLabel={search ? (search.label ?? 'Search') : undefined}
        searchPlaceholder={search?.placeholder}
        searchQuery={query}
        onSearchChange={setQuery}
        sort={sortOptions.length > 1 ? { options: sortOptions } : undefined}
        sortValue={sort}
        onSortChange={setSort}
        className="mb-4"
      />

      {/* Result count: announced to screen readers, visible while filtering */}
      <p
        role="status"
        className={isFiltered ? 'mb-6 text-sm text-muted' : 'sr-only'}
      >
        {statusText}
      </p>

      {count === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg">{noResultsMessage}</p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="mt-4 text-sm font-medium underline underline-offset-4"
          >
            Clear filters
          </button>
        </div>
      ) : (
        children(filteredItems, { values, query, sort, isFiltered })
      )}
    </div>
  );
}
