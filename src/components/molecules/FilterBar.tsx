import IconXMark from '~icons/heroicons/x-mark-20-solid';
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
          className="mb-0.5 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <IconXMark class="h-4 w-4" aria-hidden="true" />
          Clear filters
        </button>
      )}
    </div>
  );
}
