import FilterableContent, {
  type FilterField,
  type SearchConfig,
  type SortOption,
} from '@components/organisms/FilterableContent';
import type { CardImage } from '@utils/images';
import { useMemo } from 'react';

interface Partner {
  id: string;
  name: string;
  affiliation?: string;
  url?: string;
  category: string[];
  image?: CardImage;
}

interface PartnersFilteredGridProps {
  partners: Partner[];
  categories: string[];
  groupByCategory?: boolean;
}

// Default keeps the CMS order (featured first, then `order`)
const sortOptions: SortOption<Partner>[] = [
  { value: 'default', label: 'Featured' },
  {
    value: 'name',
    label: 'Name (A–Z)',
    compare: (a, b) => a.name.localeCompare(b.name),
  },
];

const search: SearchConfig = {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'affiliation', weight: 1 },
  ],
  placeholder: 'Search partners…',
};

const formatCategory = (category: string) =>
  category.charAt(0).toUpperCase() + category.slice(1);

export default function PartnersFilteredGrid({
  partners,
  categories,
  groupByCategory = false,
}: PartnersFilteredGridProps) {
  const filterFields = useMemo<FilterField<Partner>[]>(
    () => [
      {
        key: 'category',
        label: 'Category',
        options: categories.map((cat) => ({
          value: cat,
          label: formatCategory(cat),
        })),
        placeholder: 'All Categories',
        multiple: true,
        getValue: (partner) => partner.category,
      },
    ],
    [categories]
  );

  const renderPartnerCard = (partner: Partner) => (
    <a
      key={partner.id}
      href={`/partners/${partner.id}`}
      className="block text-center no-underline transition-transform hover:scale-105"
    >
      {partner.image && (
        <div className="mb-4 flex h-32 w-full items-center justify-center rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <img
            src={partner.image.src}
            width={partner.image.width}
            height={partner.image.height}
            alt=""
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        </div>
      )}
      <h4 className="mb-2 font-semibold">{partner.name}</h4>
      {partner.affiliation && (
        <p className="text-gray-500">{partner.affiliation}</p>
      )}
    </a>
  );

  // Group by category when no category is selected. A partner in several
  // categories appears under each of them.
  const groupPartners = (filteredPartners: Partner[]) =>
    categories
      .map((category) => ({
        category,
        partners: filteredPartners.filter((p) => p.category.includes(category)),
      }))
      .filter((group) => group.partners.length > 0);

  return (
    <FilterableContent
      items={partners}
      filterFields={filterFields}
      search={search}
      sortOptions={sortOptions}
      itemLabel={{ singular: 'partner', plural: 'partners' }}
      emptyMessage="No partners have been added yet."
      noResultsMessage="No partners match your filters."
    >
      {(filteredPartners, { values }) =>
        groupByCategory && (values.category ?? []).length === 0 ? (
          <div className="space-y-12">
            {groupPartners(filteredPartners).map((group) => (
              <div key={group.category}>
                <h3 className="mb-6 text-2xl font-semibold">
                  {formatCategory(group.category)}
                </h3>
                <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {group.partners.map(renderPartnerCard)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredPartners.map(renderPartnerCard)}
          </div>
        )
      }
    </FilterableContent>
  );
}
