import { type CollectionEntry, getCollection } from 'astro:content';

export type Person = CollectionEntry<'people'>['data'];

/**
 * Get all people from the collection
 */
export async function getAllPeople(): Promise<Person[]> {
  const peopleEntries = await getCollection('people');
  return peopleEntries.map((entry) => entry.data);
}

/**
 * Get people filtered by section
 */
export async function getPeopleBySection(section: string): Promise<Person[]> {
  const people = await getAllPeople();
  return people.filter((person) => person.sections.includes(section as any));
}

/**
 * Get all unique sections from people
 */
export async function getAllSections(): Promise<string[]> {
  const people = await getAllPeople();
  const sections = new Set<string>();

  people.forEach((person) => {
    person.sections.forEach((section) => sections.add(section));
  });

  return Array.from(sections).sort();
}

/**
 * Group people by section
 * Note: A person can appear in multiple sections
 */
export function groupPeopleBySection(
  people: Person[]
): Record<string, Person[]> {
  const grouped: Record<string, Person[]> = {};

  people.forEach((person) => {
    person.sections.forEach((section) => {
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(person);
    });
  });

  return grouped;
}

/**
 * Get the URL for a person's profile
 */
export function getPersonUrl(person: Person): string {
  return `/people/${person.id}`;
}
