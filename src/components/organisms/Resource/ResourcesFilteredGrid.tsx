import FilterableContent, {
  type FilterField,
  type SearchConfig,
  type SortOption,
} from '@components/organisms/FilterableContent';
import { useMemo } from 'react';
import type { SerializedResource } from './ResourceItem';
import ResourceItem from './ResourceItem';

interface ResourcesFilteredGridProps {
  resources: SerializedResource[];
  categories: { value: string; label: string }[];
}

// Default keeps the given order (newest year first, then title)
const sortOptions: SortOption<SerializedResource>[] = [
  { value: 'newest', label: 'Newest first' },
  {
    value: 'oldest',
    label: 'Oldest first',
    compare: (a, b) => a.year - b.year || a.title.localeCompare(b.title),
  },
  {
    value: 'title',
    label: 'Title (A–Z)',
    compare: (a, b) => a.title.localeCompare(b.title),
  },
];

const search: SearchConfig = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'description', weight: 1 },
    { name: 'contributorNames', weight: 1 },
    { name: 'tags', weight: 1 },
  ],
  placeholder: 'Search resources…',
};

export default function ResourcesFilteredGrid({
  resources,
  categories,
}: ResourcesFilteredGridProps) {
  const filterFields = useMemo<FilterField<SerializedResource>[]>(
    () => [
      {
        key: 'category',
        label: 'Category',
        options: categories,
        placeholder: 'All Categories',
        multiple: true,
        getValue: (resource) => resource.category,
      },
    ],
    [categories]
  );

  return (
    <FilterableContent
      items={resources}
      filterFields={filterFields}
      search={search}
      sortOptions={sortOptions}
      itemLabel={{ singular: 'resource', plural: 'resources' }}
      emptyMessage="No resources available yet. Check back soon!"
      noResultsMessage="No resources match your filters."
    >
      {(filteredResources) => (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((item) => (
            <ResourceItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </FilterableContent>
  );
}
