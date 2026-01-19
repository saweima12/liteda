import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite';
import type { Plugin } from 'vite';

/**
 * Vite plugin for config hot reload in dev mode
 * Watches config/ directory and triggers full reload on changes
 */
function configWatcher(): Plugin {
  return {
    name: 'liteda-config-watcher',
    apply: 'serve', // Only in dev mode
    configureServer(server) {
      // Disabled if AUTO_RELOAD is explicitly set to false
      if (process.env.AUTO_RELOAD === 'false') {
        console.log('[Config] Auto-reload disabled (set AUTO_RELOAD=false)');
        return;
      }

      console.log('[Config] Auto-reload enabled (Vite dev mode)');

      let reloadTimer: NodeJS.Timeout | null = null;
      let isReloading = false;

      // Watch config directory
      server.watcher.add('config/**/*.{yaml,yml,md}');

      server.watcher.on('change', (file) => {
        // Only handle config files
        if (!file.includes('config/') || !file.match(/\.(yaml|yml|md)$/)) {
          return;
        }

        if (isReloading) return;

        console.log(`[Config] File changed: ${file.replace(process.cwd() + '/', '')}`);

        // Clear existing timer
        if (reloadTimer) clearTimeout(reloadTimer);

        // Debounce: wait 2 seconds before reloading
        reloadTimer = setTimeout(async () => {
          isReloading = true;
          console.log('[Config] Restarting server...');

          try {
            // Restart the Vite server
            await server.restart();
            console.log('[Config] Server restarted successfully');
            console.log('[Config] Browser refresh required to see changes');
          } catch (error) {
            console.error('[Config] Failed to restart server:', error);
          } finally {
            isReloading = false;
          }
        }, 1000);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    sveltekit(),
    Icons({
      compiler: 'svelte',
      autoInstall: false, // We use @iconify/json
    }),
    configWatcher(),
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
  },

  // PWA Configuration
  publicDir: 'static',
});
