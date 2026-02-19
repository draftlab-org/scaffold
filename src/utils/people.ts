import { type CollectionEntry, getCollection } from 'astro:content';
import { isVisible } from '@utils/content';

export type Person = CollectionEntry<'people'>['data'];

export interface PersonData {
  id: string;
  name: string;
  title?: string;
  headshot?: any;
  [key: string]: any;
}

/**
 * Get all visible people from the collection
 */
export async function getAllPeople(): Promise<Person[]> {
  const peopleEntries = await getCollection('people');
  return peopleEntries
    .filter((entry) => isVisible(entry))
    .map((entry) => entry.data);
}

/**
 * Creates a map of people by ID for quick lookups
 */
export async function getPeopleMap(): Promise<Map<string, PersonData>> {
  const allPeople = await getCollection('people');
  return new Map(
    allPeople
      .filter((person) => isVisible(person))
      .map((person) => [person.data.id, person.data as PersonData])
  );
}

/**
 * Resolves person IDs to person names
 */
export async function getPersonNames(
  personIds: string[] | undefined,
  peopleMap?: Map<string, PersonData>
): Promise<string> {
  if (!personIds || personIds.length === 0) return '';
  const map = peopleMap ?? (await getPeopleMap());
  return personIds
    .map((id) => map.get(id)?.name)
    .filter(Boolean)
    .join(', ');
}

/**
 * Resolves person IDs to full person data
 */
export async function resolvePeople(
  personIds: string[] | undefined,
  peopleMap?: Map<string, PersonData>
): Promise<PersonData[]> {
  if (!personIds || personIds.length === 0) return [];
  const map = peopleMap ?? (await getPeopleMap());
  return personIds
    .map((id) => map.get(id))
    .filter((person): person is PersonData => person !== undefined);
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
  for (const person of people) {
    for (const section of person.sections) {
      sections.add(section);
    }
  }
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
