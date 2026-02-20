import type { FilterConfig } from '@components/molecules/FilterBar';
import FilterBar from '@components/molecules/FilterBar';
import { useCallback, useEffect, useState } from 'react';

interface Person {
  id: string;
  name: string;
  title: string;
  headshot: string;
  sections: string[];
}

interface PeopleFilteredGridProps {
  people: Person[];
  sections: string[];
  groupBySection?: boolean;
}

export default function PeopleFilteredGrid({
  people,
  sections,
  groupBySection = false,
}: PeopleFilteredGridProps) {
  const getInitialFilters = useCallback((): Record<string, string | null> => {
    const initial: Record<string, string | null> = {
      section: null,
    };

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const section = params.get('section');
      if (section) initial.section = section;
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
    setFilters({ section: null });
  };

  const filterConfig: FilterConfig[] = [
    {
      key: 'section',
      label: 'Section',
      options: sections.map((sec) => ({ value: sec, label: sec })),
      placeholder: 'All Sections',
    },
  ];

  // Filter people
  const filteredPeople = people.filter((person) => {
    if (filters.section && !person.sections.includes(filters.section)) {
      return false;
    }
    return true;
  });

  // Group by section if enabled and no filter is active
  const shouldGroup = groupBySection && !filters.section;

  const groupedPeople = shouldGroup
    ? sections.reduce(
        (acc, section) => {
          const sectionPeople = filteredPeople.filter((p) =>
            p.sections.includes(section)
          );
          if (sectionPeople.length > 0) {
            acc[section] = sectionPeople;
          }
          return acc;
        },
        {} as Record<string, Person[]>
      )
    : null;

  const renderPersonCard = (person: Person) => (
    <a
      key={person.id}
      href={`/people/${person.id}`}
      className="block transition-transform hover:scale-105"
    >
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <img
            src={person.headshot}
            alt={person.name}
            className="h-48 w-48 rounded-lg object-cover"
            loading="lazy"
          />
        </div>
        <h4 className="mb-2 font-semibold">{person.name}</h4>
        <p className="">{person.title}</p>
      </div>
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

      {filteredPeople.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg">
            No team members match your filters. Try adjusting your selection.
          </p>
        </div>
      ) : groupedPeople ? (
        // Grouped display
        <div className="space-y-12">
          {Object.entries(groupedPeople).map(([section, sectionPeople]) => (
            <div key={section}>
              <h3 className="mb-6 text-2xl font-semibold">{section}</h3>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sectionPeople.map(renderPersonCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Flat display
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPeople.map(renderPersonCard)}
        </div>
      )}
    </div>
  );
}
