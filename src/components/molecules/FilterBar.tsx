import { useId } from 'react';
import IconMagnifyingGlass from '~icons/heroicons/magnifying-glass-20-solid';
import IconXMark from '~icons/heroicons/x-mark-20-solid';
import FilterDropdown, { type FilterOption } from './FilterDropdown';

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
  // Allow selecting several options (items matching any of them are shown)
  multiple?: boolean;
}

export interface SortConfig {
  label?: string;
  options: FilterOption[];
}

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string[]>;
  onChange: (key: string, values: string[]) => void;
  onClear: () => void;
  // Text search (rendered when `searchLabel` is given)
  searchLabel?: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  // Sort (rendered when there's more than one option)
  sort?: SortConfig;
  sortValue?: string;
  onSortChange?: (value: string) => void;
  className?: string;
}

export default function FilterBar({
  filters,
  values,
  onChange,
  onClear,
  searchLabel,
  searchPlaceholder = 'Search…',
  searchQuery = '',
  onSearchChange,
  sort,
  sortValue,
  onSortChange,
  className = '',
}: FilterBarProps) {
  const searchId = useId();

  // Sort isn't a filter, so it doesn't count towards "Clear filters"
  const hasActiveFilters =
    Object.values(values).some((v) => v.length > 0) ||
    searchQuery.trim() !== '';

  return (
    <div className={`flex flex-wrap items-end gap-4 ${className}`}>
      {searchLabel && onSearchChange && (
        <div className="min-w-56 grow sm:grow-0">
          <label
            htmlFor={searchId}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {searchLabel}
          </label>
          <div className="relative">
            <IconMagnifyingGlass
              className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-3 pl-10 shadow-sm transition-all hover:border-gray-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 focus:outline-none"
            />
          </div>
        </div>
      )}

      {filters.map((filter) => (
        <FilterDropdown
          key={filter.key}
          label={filter.label}
          options={filter.options}
          selected={values[filter.key] ?? []}
          onChange={(selected) => onChange(filter.key, selected)}
          multiple={filter.multiple}
          placeholder={filter.placeholder}
          className="min-w-40"
        />
      ))}

      {sort && sort.options.length > 1 && onSortChange && (
        <FilterDropdown
          label={sort.label ?? 'Sort by'}
          options={sort.options}
          selected={sortValue ? [sortValue] : [sort.options[0].value]}
          onChange={(selected) =>
            onSortChange(selected[0] ?? sort.options[0].value)
          }
          includeAll={false}
          className="min-w-40"
        />
      )}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mb-0.5 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <IconXMark className="h-4 w-4" aria-hidden="true" />
          Clear filters
        </button>
      )}
    </div>
  );
}
