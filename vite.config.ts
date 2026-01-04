import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    Icons({
      compiler: 'svelte',
      autoInstall: false, // We use @iconify/json
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    rollupOptions: {
      external: [
        // Node.js built-in modules (available in Bun runtime)
        'fs',
        'fs/promises',
        'path',
        'url',
        'stream',
        'util',
        'events',
        'buffer',
        'crypto',
        'os',
        'net',
        'tls',
        'http',
        'https',
      ]
    }
  }
});
