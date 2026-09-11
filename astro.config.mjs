import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'https://esbjergshine.dk';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  build: {
    inlineStylesheets: 'never'
  },
  vite: {
    build: {
      cssMinify: 'lightningcss'
    }
  }
});
