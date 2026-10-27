// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ntsikagqiba.com',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Keep every stylesheet and script external so the CSP can stay
    // `script-src 'self'; style-src 'self'` with no hashes or 'unsafe-inline'.
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/404/'),
    }),
  ],
});
