// fonts.config.mjs
//
// Customise your site's fonts here. This file is protected on merge — your
// changes survive `npm run update-from-scaffold`.
//
// Fonts come from Bunny Fonts (https://fonts.bunny.net), a privacy-friendly
// CDN with the same selection as Google Fonts and no third-party tracking.
// Browse the catalogue at fonts.bunny.net, pick what you want, then update
// the `name` and `weights` below.
//
// The CSS variable names (`--font-sans`, `--font-serif`, `--font-mono`) are
// referenced throughout the codebase. Don't rename them — just change which
// font they point to.
//
// Every weight × style listed here is downloaded on demand, so keep the lists
// to what the design uses. Which files are *preloaded* (fetched before first
// paint) is set in src/components/organisms/Head.astro.

// @ts-check
import { fontProviders } from 'astro/config';

/** @type {import('astro').AstroUserConfig['fonts']} */
export const fonts = [
  {
    provider: fontProviders.bunny(),
    name: 'Rubik',
    weights: [300, 400, 500, 600, 700, 800],
    styles: ['normal', 'italic'],
    cssVariable: '--font-sans',
  },
  {
    provider: fontProviders.bunny(),
    name: 'IBM Plex Serif',
    weights: [300, 400, 500, 600, 700],
    styles: ['normal', 'italic'],
    cssVariable: '--font-serif',
  },
  {
    provider: fontProviders.bunny(),
    name: 'JetBrains Mono',
    weights: [300, 400],
    styles: ['normal'],
    cssVariable: '--font-mono',
  },
];
