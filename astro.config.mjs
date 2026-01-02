// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  integrations: [preact(), tailwindcss(), sitemap()],
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: {
      prefixDefaultLocale: true,
      strategy: 'prefix',
    },
  },
  site: 'https://malogermond.com',
  vite: {
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@layouts': '/src/layouts',
        '@assets': '/src/assets',
        '@styles': '/src/styles',
        '@analytics': '/src/components/analytics',
        '@locales': '/src/locales',
        '@utils': '/src/utils',
      },
      build: {
        minify: true,
      },
    },
    plugins: [tailwindcss()],
  },
});
