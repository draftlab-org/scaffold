import { defineCollection, type ImageFunction } from 'astro:content';
import {
  sectionBackgroundNames,
  sectionBackgroundTypes,
} from '@utils/backgrounds';
import {
  BUTTON_ICONS,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  resolveButtonLink,
} from '@utils/buttons';
import { SHARE_PLATFORMS } from '@utils/share';
import { normalizeSocialLinks, SOCIAL_PLATFORMS } from '@utils/social';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import articleCategories from './content/categories/articles.json';
import partnerCategories from './content/categories/partners.json';
import peopleCategories from './content/categories/people.json';
import resourceCategories from './content/categories/resources.json';

const statusSchema = z
  .enum(['draft', 'published', 'archived'])
  .default('draft');

// Category-bound select for a section filter. Pages CMS writes '' (or null)
// when the select is cleared, so treat those as "no filter".
const optionalCategory = (categories: string[]) =>
  z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.enum(categories as [string, ...string[]]).optional()
  );

// Pages CMS writes '' (or null) for cleared optional fields
const emptyToUndefined = (value: unknown) =>
  value === '' || value === null ? undefined : value;

// Optional reference list: '' / null / [] all mean "nothing picked"
const optionalIdList = z.preprocess(
  (value) =>
    Array.isArray(value) && value.length === 0
      ? undefined
      : emptyToUndefined(value),
  z.array(z.string()).optional()
);

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

const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: z.string().min(1),
});

// Accepts the list form and the older `{ platform: url }` object form
const socialLinksSchema = z.preprocess(
  normalizeSocialLinks,
  z.array(socialLinkSchema)
);

// A button points at a picked `link` (internal page or external URL) or, as a
// fallback, a free-text `href` (anchors, mailto:, and content written before
// `link` existed). `link` wins when both are set. A button with neither is
// valid content but is not rendered.
const buttonSchema = z
  .object({
    variant: z.enum(BUTTON_VARIANTS).default('primary'),
    size: z.enum(BUTTON_SIZES).default('md'),
    text: z.string(),
    link: z.preprocess(emptyToUndefined, flexibleLinkSchema.optional()),
    href: z.preprocess(emptyToUndefined, z.string().optional()),
    icon: z.preprocess(emptyToUndefined, z.enum(BUTTON_ICONS).optional()),
  });

export type ButtonData = z.infer<typeof buttonSchema>;

const hasButtonLink = (button: ButtonData) =>
  Boolean(resolveButtonLink(button).href);

// Buttons saved without a link are dropped rather than failing the build
const buttonListSchema = z
  .array(buttonSchema)
  .transform((buttons) => buttons.filter(hasButtonLink))
  .optional();

// A Pages CMS object field is written even when left empty, so an optional
// button without text is treated as "no button"
const optionalButtonSchema = z.preprocess(
  (value) =>
    value && typeof value === 'object' && !(value as { text?: string }).text
      ? undefined
      : emptyToUndefined(value),
  buttonSchema
    .optional()
    .transform((button) =>
      button && hasButtonLink(button) ? button : undefined
    )
);

// Section title with an optional marker-highlight style. A plain string is
// accepted too. `text` is optional because Pages CMS writes the `style`
// default even when the title is left blank.
const sectionHeadingSchema = z.preprocess(
  (value) =>
    typeof value === 'string' ? { text: value } : emptyToUndefined(value),
  z
    .object({
      text: z.preprocess(emptyToUndefined, z.string().optional()),
      style: z.preprocess(
        emptyToUndefined,
        z.enum(['plain', 'highlight']).default('plain')
      ),
    })
    .optional()
);

export type SectionHeading = NonNullable<z.infer<typeof sectionHeadingSchema>>;

const imagePositionSchema = z.preprocess(
  emptyToUndefined,
  z.enum(['left', 'right']).default('right')
);

const colorPaletteSchema = z.enum([
  'primary',
  'secondary',
  'highlight',
  'neutral',
]);

const createSchemas = (image: ImageFunction) => {
  const cardSchema = z.object({
    title: z.string(),
    content: z.string().optional(),
    image: image().optional(),
    button: optionalButtonSchema,
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
    socialLinks: z.preprocess(
      emptyToUndefined,
      socialLinksSchema.optional()
    ),
    sections: z.array(
      z.enum(peopleCategories.categories as [string, ...string[]])
    ),
    status: statusSchema,
  });

  const partnerSchema = z.object({
    name: z.string(),
    affiliation: z.string().optional(),
    url: z.string().optional(),
    // A single string is accepted for content written before partners could
    // belong to several categories
    category: z.preprocess(
      (value) => (typeof value === 'string' ? [value] : value),
      z
        .array(z.enum(partnerCategories.categories as [string, ...string[]]))
        .min(1)
    ),
    image: image().optional(),
  });

  return {
    cardSchema,
    personSchema,
    partnerSchema,
  };
};

const pagesCollection = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/pages' }),
  schema: ({ image }) => {
    const { cardSchema } = createSchemas(image);

    const SectionCommonSchema = z.object({
      background: z
        .object({
          bgColor: z.preprocess(
            emptyToUndefined,
            z.enum(sectionBackgroundNames).optional()
          ),
          bgType: z.preprocess(
            emptyToUndefined,
            z.enum(sectionBackgroundTypes).optional()
          ),
        })
        .optional(),
    });

    const sectionsSchema = z.discriminatedUnion('type', [
      SectionCommonSchema.extend({
        type: z.literal('hero'),
        title: z.string(),
        subtitle: z.string().optional(),
        backgroundImage: image().optional(),
        image: image().optional(),
        imageAlt: z.string().optional(),
        imagePosition: imagePositionSchema,
        align: z.preprocess(
          emptyToUndefined,
          z.enum(['left', 'center']).default('center')
        ),
      }),
      SectionCommonSchema.extend({
        type: z.literal('richText'),
        content: z.string(),
        withTOC: z.boolean().optional().default(false),
      }),
      SectionCommonSchema.extend({
        type: z.literal('button'),
        title: z.string().optional(),
        buttons: buttonListSchema,
      }),
      SectionCommonSchema.extend({
        type: z.literal('card'),
        title: z.string(),
        description: z.string().optional(),
        cards: z.array(cardSchema).optional(),
        buttons: buttonListSchema,
      }),
      SectionCommonSchema.extend({
        type: z.literal('people'),
        category: optionalCategory(peopleCategories.categories),
      }),
      SectionCommonSchema.extend({
        type: z.literal('partners'),
        title: z.string(),
        category: optionalCategory(partnerCategories.categories),
      }),
      SectionCommonSchema.extend({
        type: z.literal('articlesRoll'),
        title: z.string().optional(),
        limit: z.number().optional().default(3),
        category: optionalCategory(articleCategories.categories),
        showViewAll: z.boolean().optional().default(true),
      }),
      SectionCommonSchema.extend({
        type: z.literal('featuredPartners'),
        title: z.string().optional(),
        description: z.string().optional(),
        partners: optionalIdList,
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
      SectionCommonSchema.extend({
        type: z.literal('callToAction'),
        title: sectionHeadingSchema,
        description: z.string().optional(),
        image: image().optional(),
        imageAlt: z.string().optional(),
        imagePosition: imagePositionSchema,
        buttons: buttonListSchema,
      }),
      SectionCommonSchema.extend({
        type: z.literal('miniCta'),
        text: z.string(),
        button: optionalButtonSchema,
      }),
      SectionCommonSchema.extend({
        type: z.literal('testimonials'),
        title: sectionHeadingSchema,
        description: z.string().optional(),
        testimonials: z
          .array(
            z
              .object({
                quote: z.string(),
                name: z.preprocess(emptyToUndefined, z.string().optional()),
                role: z.preprocess(emptyToUndefined, z.string().optional()),
                image: image().optional(),
                // Person ID; fills in name, role and photo when left empty
                person: z.preprocess(emptyToUndefined, z.string().optional()),
              })
          )
          .optional(),
      }),
      SectionCommonSchema.extend({
        type: z.literal('logoWall'),
        title: sectionHeadingSchema,
        description: z.string().optional(),
        // Partner IDs in display order; empty shows featured partners
        partners: optionalIdList,
        layout: z.preprocess(
          emptyToUndefined,
          z.enum(['grid', 'scroll']).default('grid')
        ),
        fullBleed: z.boolean().optional().default(false),
      }),
      SectionCommonSchema.extend({
        type: z.literal('featuredArticles'),
        title: sectionHeadingSchema,
        description: z.string().optional(),
        // Article permalinks in display order
        articles: optionalIdList,
      }),
    ]);

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
      breadcrumbs: z.preprocess(
        emptyToUndefined,
        z.enum(['auto', 'show', 'hide']).default('auto')
      ),
      sections: sectionsSchema
        .array()
        // A page saved with no sections writes a bare `sections:` (null)
        .nullish(),
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
      categories: z
        .array(z.enum(articleCategories.categories as [string, ...string[]]))
        .optional(),
      publishedDate: z.date(),
      heroImage: image().optional(),
      relatedArticles: optionalIdList,
      // Resource IDs
      relatedResources: optionalIdList,
    }),
});

const siteCollection = defineCollection({
  // `_`-prefixed files (e.g. _redirects.json) are build config, not site entries
  loader: glob({ pattern: '**/[^_]*.json', base: './src/content/site' }),
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
      social: z.preprocess(emptyToUndefined, socialLinksSchema.optional()),
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
      // Site-wide switch for breadcrumbs (pages can still hide them individually)
      showBreadcrumbs: z.boolean().optional().default(true),
      // Share links on articles and resources; empty platforms → defaults
      share: z
        .object({
          enabled: z.boolean().optional().default(true),
          platforms: z.array(z.enum(SHARE_PLATFORMS)).nullish(),
        })
        .optional(),
      analytics: z
        .object({
          umami: z
            .object({
              src: z.string().optional(),
              websiteId: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
    }),
});

const navLinkFields = {
  label: z.string(),
  link: flexibleLinkSchema,
  description: z.string().optional(),
};

const navItemLinkSchema = z.object({
  type: z.literal('link'),
  ...navLinkFields,
});

// Children of a dropdown written before nested menus existed have no `type`,
// so default it to 'link' to keep two-level menus valid.
const withDefaultLinkType = (value: unknown) =>
  value && typeof value === 'object' && !('type' in value)
    ? { ...value, type: 'link' }
    : value;

// Second level: a link, or a group (dropdown) of links — the third level
const navItemChildSchema = z.preprocess(
  withDefaultLinkType,
  z.discriminatedUnion('type', [
    navItemLinkSchema,
    z.object({
      type: z.literal('dropdown'),
      label: z.string(),
      children: z.array(z.preprocess(withDefaultLinkType, navItemLinkSchema)),
    }),
  ])
);

const navItemDropdownSchema = z.object({
  type: z.literal('dropdown'),
  label: z.string(),
  children: z.array(navItemChildSchema),
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
    // Resource IDs
    relatedResources: z.array(z.string()).nullish(),
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
