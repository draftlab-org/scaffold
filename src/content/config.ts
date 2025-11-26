import { defineCollection, z } from 'astro:content';

const peopleCollection = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    name: z.string(),
    headshot: z.string(),
    title: z.string(),
    sections: z.array(z.string()),
  }),
});

export const collections = {
  people: peopleCollection,
};
