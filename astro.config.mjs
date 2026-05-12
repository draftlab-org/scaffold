// @ts-check

import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import Icons from 'unplugin-icons/vite';
import { fonts } from './fonts.config.mjs';
import { siteConfig } from './src/lib/config.ts';
import remarkEmbedLink from './src/lib/remark-embed-link.ts';

// https://astro.build/config
export default defineConfig({
  site: siteConfig.url,
  devToolbar: {
    enabled: false,
  },
  fonts,

  markdown: {
    remarkPlugins: [remarkEmbedLink],
  },

  vite: {
    plugins: [
      tailwindcss(),
      Icons({
        compiler: 'jsx',
        jsx: 'react',
      }),
    ],
  },

  integrations: [
    react(),
    sitemap(),
    expressiveCode({
      themes: ['catppuccin-frappe'],
      defaultProps: {
        // Enable word wrap by default
        wrap: true,
        // Disable wrapped line indentation for terminal languages
        overridesByLang: {
          'bash,ps,sh': { preserveIndent: false },
        },
      },
    }),
    mdx(),
  ],
  adapter: netlify(),
});
