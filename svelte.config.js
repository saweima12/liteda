import adapter from 'svelte-adapter-bun';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      out: 'build',
      precompress: true,
      // Suppress warnings for Node.js built-in modules
      external: ['fs', 'fs/promises', 'path', 'url', 'stream', 'util', 'crypto', 'os']
    }),
    alias: {
      $components: 'src/lib/components',
      $widgets: 'src/lib/widgets',
      $config: 'src/lib/config'
    }
  }
};

export default config;
