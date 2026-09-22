import FilterableContent, {
  type FilterField,
  type SearchConfig,
  type SortOption,
} from '@components/organisms/FilterableContent';
import type { CardImage } from '@utils/images';
import { useMemo } from 'react';

interface Person {
  id: string;
  name: string;
  title: string;
  headshot: CardImage;
  sections: string[];
}

interface PeopleFilteredGridProps {
  people: Person[];
  sections: string[];
  groupBySection?: boolean;
}

// Default keeps the CMS order
const sortOptions: SortOption<Person>[] = [
  { value: 'default', label: 'Default' },
  {
    value: 'name',
    label: 'Name (A–Z)',
    compare: (a, b) => a.name.localeCompare(b.name),
  },
];

const search: SearchConfig = {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'title', weight: 1 },
  ],
  placeholder: 'Search people…',
};

export default function PeopleFilteredGrid({
  people,
  sections,
  groupBySection = false,
}: PeopleFilteredGridProps) {
  const filterFields = useMemo<FilterField<Person>[]>(
    () => [
      {
        key: 'section',
        label: 'Section',
        options: sections.map((sec) => ({ value: sec, label: sec })),
        placeholder: 'All Sections',
        multiple: true,
        getValue: (person) => person.sections,
      },
    ],
    [sections]
  );

  const renderPersonCard = (person: Person) => (
    <a
      key={person.id}
      href={`/people/${person.id}`}
      className="block transition-transform hover:scale-105"
    >
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <img
            src={person.headshot.src}
            width={person.headshot.width}
            height={person.headshot.height}
            alt=""
            className="h-48 w-48 rounded-lg object-cover"
            loading="lazy"
          />
        </div>
        <h4 className="mb-2 font-semibold">{person.name}</h4>
        <p className="">{person.title}</p>
      </div>
    </a>
  );

  // Group by section when no section is selected
  const groupPeople = (filteredPeople: Person[]) =>
    sections
      .map((section) => ({
        section,
        people: filteredPeople.filter((p) => p.sections.includes(section)),
      }))
      .filter((group) => group.people.length > 0);

  return (
    <FilterableContent
      items={people}
      filterFields={filterFields}
      search={search}
      sortOptions={sortOptions}
      itemLabel={{ singular: 'person', plural: 'people' }}
      emptyMessage="No team members have been added yet."
      noResultsMessage="No team members match your filters."
    >
      {(filteredPeople, { values }) =>
        groupBySection && (values.section ?? []).length === 0 ? (
          <div className="space-y-12">
            {groupPeople(filteredPeople).map((group) => (
              <div key={group.section}>
                <h3 className="mb-6 text-2xl font-semibold">{group.section}</h3>
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.people.map(renderPersonCard)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPeople.map(renderPersonCard)}
          </div>
        )
      }
    </FilterableContent>
  );
}
