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
  }
});
