// Section background palette — single source of truth.
//
// Every consumer derives from this map: the Zod enum in `content.config.ts`,
// the background and text classes in `SectionLayout.astro`, and the
// `prose-invert` decision in `RichTextSection.astro`. Adding a background here
// is the only code edit needed — then add it to the `background_select`
// dropdown in `.pages.yml`.
//
// `dark: true` means the background is dark enough that content must invert.
// Set it honestly: it drives text colour, prose inversion and link contrast.

export const sectionBackgrounds = {
  white: { label: 'White', bg: 'bg-white', dark: false },
  gray: { label: 'Gray', bg: 'bg-gray-50', dark: false },
  gradient: {
    label: 'Gradient',
    bg: 'bg-linear-to-br from-primary-50 to-highlight-100',
    dark: false,
  },
  'primary-light': { label: 'Primary (light)', bg: 'bg-primary-100', dark: false },
  'secondary-light': {
    label: 'Secondary (light)',
    bg: 'bg-secondary-50',
    dark: false,
  },
  'highlight-light': {
    label: 'Highlight (light)',
    bg: 'bg-highlight-50',
    dark: false,
  },
  dark: { label: 'Dark', bg: 'bg-gray-900', dark: true },
  'highlight-dark': {
    label: 'Highlight (dark)',
    bg: 'bg-highlight-900',
    dark: true,
  },
} as const;

export type SectionBackground = keyof typeof sectionBackgrounds;

// Tuple form for `z.enum()`, which needs at least one literal
export const sectionBackgroundNames = Object.keys(sectionBackgrounds) as [
  SectionBackground,
  ...SectionBackground[],
];

// How the background colour is applied: across the full width of the page,
// only behind the content container, or as the decorative highlight shape
export const sectionBackgroundTypes = ['full', 'contained', 'highlight'] as const;

export type SectionBackgroundType = (typeof sectionBackgroundTypes)[number];

export const isDarkBackground = (color?: string): boolean =>
  !!color && sectionBackgrounds[color as SectionBackground]?.dark === true;

export const backgroundClass = (color?: string): string =>
  (color && sectionBackgrounds[color as SectionBackground]?.bg) || '';

// `section-dark` is a hook, not a colour: it lets the stylesheets fix link,
// code and muted-text contrast for descendants, which a single text colour on
// the container cannot do (links set their own colour).
export const textClass = (color?: string): string =>
  isDarkBackground(color) ? 'section-dark text-white' : '';
