// Share links for content pages. Every platform is a plain link to the
// network's own share page, so nothing loads third-party scripts.

export const SHARE_PLATFORMS = [
  'bluesky',
  'mastodon',
  'linkedin',
  'reddit',
  'email',
] as const;

export type SharePlatform = (typeof SHARE_PLATFORMS)[number];

export const DEFAULT_SHARE_PLATFORMS: SharePlatform[] = [
  'bluesky',
  'mastodon',
  'linkedin',
  'email',
];

export const SHARE_LABELS: Record<SharePlatform, string> = {
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  linkedin: 'LinkedIn',
  reddit: 'Reddit',
  email: 'Email',
};

const encode = encodeURIComponent;

export const SHARE_URL_BUILDERS: Record<
  SharePlatform,
  (url: string, title: string) => string
> = {
  bluesky: (url, title) =>
    `https://bsky.app/intent/compose?text=${encode(`${title} ${url}`)}`,
  // Mastodon has no central share endpoint; Toot (open source) asks the
  // reader for their instance and forwards them to its share page
  mastodon: (url, title) => `https://toot.kytta.dev/?text=${encode(`${title} ${url}`)}`,
  linkedin: (url) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encode(url)}`,
  reddit: (url, title) =>
    `https://www.reddit.com/submit?url=${encode(url)}&title=${encode(title)}`,
  email: (url, title) =>
    `mailto:?subject=${encode(title)}&body=${encode(url)}`,
};
