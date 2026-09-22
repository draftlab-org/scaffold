// @ts-check

import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import Icons from 'unplugin-icons/vite';
import { fonts } from './fonts.config.mjs';
import { siteConfig } from './src/lib/config.ts';
import {
  autolinkHeadingsOptions,
  expressiveCodeOptions,
  externalLinksOptions,
} from './src/lib/markdown-plugins.ts';
import { buildRedirects } from './src/lib/redirects.ts';
import remarkEmbedLink from './src/lib/remark-embed-link.ts';

// https://astro.build/config
export default defineConfig({
  // Managed in Pages CMS (Settings → Redirects): src/content/site/_redirects.json
  redirects: buildRedirects(),
  site: siteConfig.url,
  devToolbar: {
    enabled: false,
  },
  fonts,

  image: {
    // Markdown images carry no width, so without a layout Astro emits them at
    // their original size (often 4000px+) into a ~700px prose column.
    layout: 'constrained',
  },

  markdown: {
    // Astro 7 defaults to its own processor; unified keeps remark/rehype
    // plugins working for .md content collections.
    processor: unified({
      remarkPlugins: [remarkEmbedLink],
      rehypePlugins: [
        // Astro assigns heading ids after user plugins; do it first so the
        // anchors below have ids to link to (it's idempotent)
        rehypeHeadingIds,
        [rehypeAutolinkHeadings, autolinkHeadingsOptions],
        [rehypeExternalLinks, externalLinksOptions],
      ],
    }),
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
    expressiveCode(expressiveCodeOptions),
    mdx(),
  ],
  adapter: netlify({
    // Edge-function emulation in `astro dev` conflicts with recent Deno
    // releases. Scaffold ships no edge functions, so switch it off.
    devFeatures: {
      environmentVariables: false,
      images: true,
      edgeFunctions: false,
    },
  }),
});
