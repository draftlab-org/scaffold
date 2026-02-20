import type { FilterConfig } from '@components/molecules/FilterBar';
import FilterBar from '@components/molecules/FilterBar';
import { useCallback, useEffect, useState } from 'react';

interface Partner {
  id: string;
  name: string;
  affiliation?: string;
  url?: string;
  category: string;
  image?: string;
}

interface PartnersFilteredGridProps {
  partners: Partner[];
  categories: string[];
  groupByCategory?: boolean;
}

export default function PartnersFilteredGrid({
  partners,
  categories,
  groupByCategory = false,
}: PartnersFilteredGridProps) {
  const getInitialFilters = useCallback((): Record<string, string | null> => {
    const initial: Record<string, string | null> = {
      category: null,
    };

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const category = params.get('category');
      if (category) initial.category = category;
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
    setFilters({ category: null });
  };

  const filterConfig: FilterConfig[] = [
    {
      key: 'category',
      label: 'Category',
      options: categories.map((cat) => ({
        value: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
      })),
      placeholder: 'All Categories',
    },
  ];

  // Filter partners
  const filteredPartners = partners.filter((partner) => {
    if (filters.category && partner.category !== filters.category) {
      return false;
    }
    return true;
  });

  // Group by category if enabled and no filter is active
  const shouldGroup = groupByCategory && !filters.category;

  const groupedPartners = shouldGroup
    ? categories.reduce(
        (acc, category) => {
          const categoryPartners = filteredPartners.filter(
            (p) => p.category === category
          );
          if (categoryPartners.length > 0) {
            acc[category] = categoryPartners;
          }
          return acc;
        },
        {} as Record<string, Partner[]>
      )
    : null;

  const renderPartnerCard = (partner: Partner) => (
    <a
      key={partner.id}
      href={`/partners/${partner.id}`}
      className="block text-center no-underline transition-transform hover:scale-105"
    >
      {partner.image && (
        <div className="mb-4 flex h-32 w-full items-center justify-center rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <img
            src={partner.image}
            alt={partner.name}
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

  return (
    <div>
      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        className="mb-8"
      />

      {filteredPartners.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg">
            No partners match your filters. Try adjusting your selection.
          </p>
        </div>
      ) : groupedPartners ? (
        // Grouped display
        <div className="space-y-12">
          {Object.entries(groupedPartners).map(([category, categoryPartners]) => (
            <div key={category}>
              <h3 className="mb-6 text-2xl font-semibold capitalize">
                {category}
              </h3>
              <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {categoryPartners.map(renderPartnerCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat display
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredPartners.map(renderPartnerCard)}
        </div>
      )}
    </div>
  );
}
