// Button options exposed to editors — single source of truth for the Zod
// enums in `content.config.ts` and the rendering in `Button.tsx`. Keep the
// `button` component dropdowns in `.pages.yml` in sync when changing these.

import {
  type FlexibleLink,
  isExternalLink,
  resolveFlexibleLink,
} from '@utils/navigation';

export const BUTTON_VARIANTS = [
  'primary',
  'secondary',
  'outline',
  'ghost',
] as const;

export const BUTTON_SIZES = ['sm', 'md', 'lg', 'xl'] as const;

// Icon names map to components in `Button.tsx`. Arrow-style icons render
// after the label, everything else before it.
export const BUTTON_ICONS = [
  'arrow-right',
  'external',
  'download',
  'email',
  'calendar',
  'document',
  'chat',
  'heart',
  'play',
] as const;

export type ButtonIcon = (typeof BUTTON_ICONS)[number];

export const TRAILING_BUTTON_ICONS: readonly ButtonIcon[] = [
  'arrow-right',
  'external',
];

export interface ButtonLinkFields {
  link?: FlexibleLink | null;
  href?: string | null;
}

// Resolve where a CMS button points. A picked `link` (internal page or
// external URL) wins; the legacy free-text `href` is the fallback, which
// also covers anchors (`#section`) and `mailto:` links.
export function resolveButtonLink({ link, href }: ButtonLinkFields): {
  href: string | undefined;
  external: boolean;
} {
  if (link && (link.pageRef || link.url)) {
    return { href: resolveFlexibleLink(link), external: isExternalLink(link) };
  }
  if (href) {
    return { href, external: /^https?:\/\//i.test(href) };
  }
  return { href: undefined, external: false };
}
