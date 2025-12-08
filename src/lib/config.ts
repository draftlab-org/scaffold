// Import site config directly from JSON (works at build time and runtime)
import configData from '../content/site/config.json';

// Export the config data with proper typing
export const siteConfig = {
  name: configData.title,
  title: configData.title,
  description: configData.description,
  url: configData.url,
  favicon: configData.favicon,
  defaultOgImage: configData.defaultOgImage,
  social: configData.social,
} as const;

// Export type for use in components
export type SiteConfig = typeof siteConfig;
