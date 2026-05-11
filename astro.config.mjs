// @ts-check

import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import Icons from 'unplugin-icons/vite';
import { siteConfig } from './src/lib/config.ts';

// https://astro.build/config
export default defineConfig({
  site: siteConfig.url,
  devToolbar: {
    enabled: false,
  },
  fonts: [
    {
      provider: fontProviders.bunny(),
      name: 'Rubik',
      weights: [300, 400, 500, 600, 700, 800],
      cssVariable: '--font-rubik',
    },
    {
      provider: fontProviders.bunny(),
      name: 'IBM Plex Serif',
      weights: [300, 400, 500, 600, 700],
      cssVariable: '--font-ibm-plex-serif',
    },
    {
      provider: fontProviders.bunny(),
      name: 'JetBrains Mono',
      weights: [300, 400],
      cssVariable: '--font-jetbrains-mono',
    },
  ],

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
