// Social platforms — single source of truth.
//
// Every consumer derives from this list: the Zod enum in `content.config.ts`,
// the labels and icons in `SocialLinks.astro`, and the platform dropdown in
// `.pages.yml` (keep that `values:` list in sync when adding a platform here).

export const SOCIAL_PLATFORMS = [
  'website',
  'email',
  'newsletter',
  'rss',
  'bluesky',
  'mastodon',
  'threads',
  'x',
  'linkedin',
  'instagram',
  'facebook',
  'youtube',
  'peertube',
  'github',
  'gitlab',
  'codeberg',
  'medium',
  'substack',
  'signal',
  'matrix',
  'discord',
  'orcid',
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  website: 'Website',
  email: 'Email',
  newsletter: 'Newsletter',
  rss: 'RSS feed',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  threads: 'Threads',
  x: 'X',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  peertube: 'PeerTube',
  github: 'GitHub',
  gitlab: 'GitLab',
  codeberg: 'Codeberg',
  medium: 'Medium',
  substack: 'Substack',
  signal: 'Signal',
  matrix: 'Matrix',
  discord: 'Discord',
  orcid: 'ORCID',
};

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

const isSocialPlatform = (value: string): value is SocialPlatform =>
  (SOCIAL_PLATFORMS as readonly string[]).includes(value);

// Older configs stored social links as an object keyed by platform
// (`{ "github": "https://…" }`). Convert that shape to the list form so
// sites updating from scaffold keep working without a content migration.
export function normalizeSocialLinks(value: unknown): unknown {
  if (value === null || value === undefined || value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(
        ([platform, url]) =>
          isSocialPlatform(platform) &&
          typeof url === 'string' &&
          url.trim() !== ''
      )
      .map(([platform, url]) => ({ platform, url }));
  }
  return value;
}

// Email addresses may be entered bare; everything else is used as-is
export function socialHref({ platform, url }: SocialLink): string {
  const trimmed = url.trim();
  if (platform === 'email' && !/^mailto:/i.test(trimmed)) {
    return `mailto:${trimmed}`;
  }
  return trimmed;
}

export function findSocialLink(
  links: SocialLink[] | undefined,
  platform: SocialPlatform
): SocialLink | undefined {
  return links?.find((link) => link.platform === platform);
}
