import { defineCollection, type ImageFunction, z } from 'astro:content';

// Helper to create schemas with image support
const createSchemas = (image: ImageFunction) => {
  // Atoms
  const buttonSchema = z.object({
    variant: z.string(),
    size: z.string(),
    href: z.string(),
    text: z.string(),
  });

  // Organisms

  // Card
  const cardSchema = z.object({
    title: z.string(),
    content: z.string().optional(),
    image: image().optional(),
    button: buttonSchema.optional(),
  });

  //  Person
  const personSchema = z.object({
    id: z.string(),
    name: z.string(),
    headshot: image(),
    title: z.string(),
    sections: z.array(z.string()),
  });

  //  Partner
  const partnerSchema = z.object({
    name: z.string(),
    affiliation: z.string().optional(),
    url: z.string().optional(),
    category: z.string(),
    image: image().optional(),
  });

  return { buttonSchema, cardSchema, personSchema, partnerSchema };
};

const pagesCollection = defineCollection({
  type: 'data',
  schema: ({ image }) => {
    const { buttonSchema, cardSchema, personSchema, partnerSchema } =
      createSchemas(image);

    // Sections defined as a union type so they can be used as variable components
    const sectionsSchema = z.discriminatedUnion('type', [
      z.object({
        type: z.literal('hero'),
        title: z.string(),
        subtitle: z.string().optional(),
        backgroundImage: image().optional(),
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

    return z.object({
      title: z.string(),
      description: z.string().optional(),
      sections: z.array(sectionsSchema),
    });
  },
});

const peopleCollection = defineCollection({
  type: 'data',
  schema: ({ image }) => createSchemas(image).personSchema,
});

const articlesCollection = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      authors: z.array(z.string()), // References to people collection IDs
      published: z.enum(['draft', 'published']),
      tags: z.array(z.string()),
      publishedDate: z.date(),
      backgroundImage: image().optional(),
    }),
});

export const collections = {
  people: peopleCollection,
  pages: pagesCollection,
  articles: articlesCollection,
};
