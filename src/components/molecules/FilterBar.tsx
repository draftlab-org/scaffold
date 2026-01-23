import FilterDropdown, { type FilterOption } from './FilterDropdown';

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string | null>;
  onChange: (key: string, value: string | null) => void;
  onClear: () => void;
  className?: string;
}

export default function FilterBar({
  filters,
  values,
  onChange,
  onClear,
  className = '',
}: FilterBarProps) {
  // Check if any filters are active
  const hasActiveFilters = Object.values(values).some((v) => v !== null);

  return (
    <div className={`flex flex-wrap items-end gap-4 ${className}`}>
      {filters.map((filter) => (
        <FilterDropdown
          key={filter.key}
          label={filter.label}
          options={filter.options}
          selected={values[filter.key] || null}
          onChange={(value) => onChange(filter.key, value)}
          placeholder={filter.placeholder}
          className="min-w-40"
        />
      ))}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mb-0.5 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
          Clear filters
        </button>
      )}
    </div>
  );
}
