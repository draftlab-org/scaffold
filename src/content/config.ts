import { defineCollection, z } from 'astro:content';

// Atoms

//  Button
const buttonSchema = z.object({
  variant: z.string(),
  size: z.string(),
  href: z.string(),
});

// Organisms

// Card
const cardSchema = z.object({
  title: z.string(),
  content: z.string().optional(),
  image: z.string().optional(),
  button: buttonSchema.optional(),
});

//  Person
const personSchema = z.object({
  id: z.string(),
  name: z.string(),
  headshot: z.string(),
  title: z.string(),
  sections: z.array(z.string()),
});

//  Partner
const partnerSchema = z.object({
  name: z.string(),
  affiliation: z.string().optional(),
  url: z.string().optional(),
  category: z.string(),
  image: z.string(),
});

// Sections defined as a union type so they can be used as variable components
const sectionsSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hero'),
    title: z.string(),
    subtitle: z.string().optional(),
    backgroundImage: z.string().optional(),
  }),
  z.object({
    type: z.literal('richText'),
    background: z.string(),
    content: z.string(),
  }),
  z.object({
    type: z.literal('card'),
    title: z.string(),
    description: z.string().optional(),
    cards: z.array(cardSchema).optional(),
    buttons: z.array(buttonSchema).optional(),
  }),
  z.object({
    type: z.literal('people'),
    category: z.string(),
    people: z.array(personSchema),
  }),
  z.object({
    type: z.literal('partners'),
    title: z.string(),
    partners: z.array(partnerSchema),
  }),
  // Add more section types as needed
]);

const pagesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    sections: z.array(sectionsSchema),
  }),
});

const peopleCollection = defineCollection({
  type: 'data',
  schema: personSchema,
});

export const collections = {
  people: peopleCollection,
  pages: pagesCollection,
};
