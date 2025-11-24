// @ts-check

import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  experimental: {
    fonts: [
      {
        provider: fontProviders.bunny(),
        name: 'Inter',
        weights: [100, 200, 300, 400, 500, 600],
        cssVariable: '--font-inter',
      }
    ],
  },

  vite: {
    // @ts-expect-error
    // TODO #1 - remove expect error when Astro updates to Vite 7
    // https://github.com/withastro/astro/issues/14030#issuecomment-3027129338
    plugins: [tailwindcss()],
  },

  integrations: [react(), sitemap(), mdx()],
  adapter: netlify(),
});
