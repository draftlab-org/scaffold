import { defineCollection, type ImageFunction } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import articleCategories from './content/categories/articles.json';
import partnerCategories from './content/categories/partners.json';
import peopleCategories from './content/categories/people.json';
import resourceCategories from './content/categories/resources.json';

const statusSchema = z
  .enum(['draft', 'published', 'archived'])
  .default('draft');

const colorPaletteSchema = z.enum([
  'primary',
  'secondary',
  'highlight',
  'neutral',
]);

const createSchemas = (image: ImageFunction) => {
  const buttonSchema = z.object({
    variant: z.string(),
    size: z.string(),
    href: z.string(),
    text: z.string(),
  });

  const cardSchema = z.object({
    title: z.string(),
    content: z.string().optional(),
    image: image().optional(),
    button: buttonSchema.optional(),
    color: colorPaletteSchema.optional(),
  });

  const personSchema = z.object({
    id: z.string(),
    name: z.string(),
    headshot: image(),
    title: z.string().optional(),
    affiliation: z.string().optional(),
    extraInfo: z.string().optional(),
    url: z.string().optional(),
    sections: z.array(
      z.enum(peopleCategories.categories as [string, ...string[]])
    ),
    status: statusSchema,
  });

  const partnerSchema = z.object({
    name: z.string(),
    affiliation: z.string().optional(),
    url: z.string().optional(),
    category: z.enum(partnerCategories.categories as [string, ...string[]]),
    image: image().optional(),
  });

  return {
    buttonSchema,
    cardSchema,
    personSchema,
    partnerSchema,
  };
};

const pagesCollection = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/pages' }),
  schema: ({ image }) => {
    const { buttonSchema, cardSchema } = createSchemas(image);

    const SectionCommonSchema = z.object({
      background: z
        .object({
          bgColor: z.string().optional(),
          bgType: z.string().optional(),
        })
        .optional(),
    });

    const sectionsSchema = z.discriminatedUnion('type', [
      SectionCommonSchema.extend({
        type: z.literal('hero'),
        title: z.string(),
        subtitle: z.string().optional(),
        backgroundImage: image().optional(),
      }),
      SectionCommonSchema.extend({
        type: z.literal('richText'),
        content: z.string(),
        withTOC: z.boolean().optional().default(false),
      }),
      SectionCommonSchema.extend({
        type: z.literal('button'),
        title: z.string().optional(),
        buttons: z.array(buttonSchema).optional(),
      }),
      SectionCommonSchema.extend({
        type: z.literal('card'),
        title: z.string(),
        description: z.string().optional(),
        cards: z.array(cardSchema).optional(),
        buttons: z.array(buttonSchema).optional(),
      }),
      SectionCommonSchema.extend({
        type: z.literal('people'),
        category: z.string().optional(),
      }),
      SectionCommonSchema.extend({
        type: z.literal('partners'),
        title: z.string(),
        category: z.string().optional(),
      }),
      SectionCommonSchema.extend({
        type: z.literal('articlesRoll'),
        title: z.string().optional(),
        limit: z.number().optional().default(3),
        category: z.string().optional(),
        showViewAll: z.boolean().optional().default(true),
      }),
      SectionCommonSchema.extend({
        type: z.literal('featuredPartners'),
        title: z.string().optional(),
        description: z.string().optional(),
        partners: z.array(z.string()).optional(),
        limit: z.number().optional().default(4),
        showViewAll: z.boolean().optional().default(false),
      }),
      SectionCommonSchema.extend({
        type: z.literal('resourcesRoll'),
        title: z.string().default('Resources'),
        description: z.string().optional(),
        limit: z.number().min(1).max(12).default(3),
        showViewAll: z.boolean().default(false),
      }),
    ]);

    const flexiSectionSchema = SectionCommonSchema.extend({
      type: z.literal('flexi'),
      title: z.string(),
      description: z.string().optional(),
      sections: z.array(sectionsSchema),
    });

    return z.object({
      title: z.string(),
      description: z.string().optional(),
      heroImage: image().optional(),
      background: z
        .enum(['white', 'gray', 'gradient', 'highlight'])
        .default('white')
        .optional(),
      permalink: z.string().optional(),
      status: statusSchema,
      sections: z
        .union([...sectionsSchema.options, flexiSectionSchema])
        .array()
        .optional(),
    });
  },
});

const peopleCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/people' }),
  schema: ({ image }) => createSchemas(image).personSchema,
});

const partnersCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/partners' }),
  schema: ({ image }) => {
    const { partnerSchema } = createSchemas(image);
    return partnerSchema.extend({
      id: z.string(),
      order: z.number().optional().default(999),
      featured: z.boolean().optional().default(false),
      status: statusSchema,
    });
  },
});

const articlesCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: ({ image }) =>
    z.object({
      permalink: z.string(),
      title: z.string(),
      excerpt: z.string().optional(),
      authors: z.array(z.string()),
      status: statusSchema,
      tags: z.array(z.string()),
      categories: z
        .array(z.enum(articleCategories.categories as [string, ...string[]]))
        .optional(),
      publishedDate: z.date(),
      heroImage: image().optional(),
      relatedArticles: z.array(z.string()).max(3).optional(),
    }),
});

const siteCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/site' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      url: z.url(),
      favicon: z.string().default('/favicon.svg'),
      defaultOgImage: image().optional(),
      defaultLogoLight: image().optional(),
      defaultLogoDark: image().optional(),
      defaultLogoSquare: image().optional(),
      social: z
        .object({
          bluesky: z.string().optional(),
          github: z.string().optional(),
          mastodon: z.string().optional(),
          linkedin: z.string().optional(),
          x: z.string().optional(),
          facebook: z.string().optional(),
          instagram: z.string().optional(),
          youtube: z.string().optional(),
        })
        .optional(),
      footer: z.object({
        description: z.string().optional(),
        bottom: z.string(),
      }),
      archivedBanner: z
        .object({
          message: z.string(),
          color: colorPaletteSchema,
        })
        .optional(),
      cookieConsent: z
        .object({
          message: z.string(),
          googleAnalyticsId: z.string().optional(),
        })
        .optional(),
    }),
});

const flexibleLinkSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('internal'),
    pageRef: z.string(),
  }),
  z.object({
    type: z.literal('external'),
    url: z.url(),
  }),
]);

const navItemLinkSchema = z.object({
  type: z.literal('link'),
  label: z.string(),
  link: flexibleLinkSchema,
  description: z.string().optional(),
});

const navItemDropdownSchema = z.object({
  type: z.literal('dropdown'),
  label: z.string(),
  children: z.array(
    z.object({
      label: z.string(),
      link: flexibleLinkSchema,
      description: z.string().optional(),
    })
  ),
});

const navigationItemSchema = z.discriminatedUnion('type', [
  navItemLinkSchema,
  navItemDropdownSchema,
]);

const navigationCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/navigation' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    items: z.array(navigationItemSchema),
  }),
});

const categoriesCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/categories' }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    categories: z.array(z.string()),
  }),
});

const resourcesCollection = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/resources' }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    status: statusSchema,
    description: z.string().optional(),
    authors: z.string().optional(),
    contributors: z.array(z.string()).optional(),
    year: z.number(),
    category: z.enum(resourceCategories.categories as [string, ...string[]]),
    externalLinks: z
      .array(
        z.object({
          label: z.string(),
          url: z.url(),
        })
      )
      .optional(),
    publishedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

const docsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    permalink: z.string(),
    title: z.string(),
    chapter: z.string(),
    chapterOrder: z.number(),
    order: z.number(),
    status: statusSchema,
    description: z.string().optional(),
  }),
});

export const collections = {
  people: peopleCollection,
  pages: pagesCollection,
  articles: articlesCollection,
  docs: docsCollection,
  site: siteCollection,
  navigation: navigationCollection,
  partners: partnersCollection,
  categories: categoriesCollection,
  resources: resourcesCollection,
};
