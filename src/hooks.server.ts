import type { ServerInit } from '@sveltejs/kit';
import { loadSettings, loadAllPages, extractWidgets, extractGadgets, setCachedConfig, type Page } from '$config';
import { updateWidgetConfigs } from '$lib/widgets';
import { updateGadgetConfigs } from '$lib/gadgets/config-store';
import { updateStatusCheckConfigs } from '$lib/status-check';
import { initI18n } from '$lib/i18n';
import { loadFeatures } from '$lib/features';
import { watch } from 'fs';

/**
 * Load all configuration (can be called multiple times for hot reload)
 *
 * @param isInitialLoad - If true, loads features. Features are NOT reloaded on hot reload.
 */
async function loadConfiguration(isInitialLoad = false) {
    try {
        const settings = await loadSettings();

    // Initialize i18n with locale from settings
    const locale = settings.i18n?.locale || 'en';
    await initI18n(locale);

    const pagesContent = await loadAllPages(settings);
    const pagesList: Page[] = settings.pages || [
        { id: 'home', name: 'Home', icon: 'home', file: 'services.yaml' }
    ];

    // Load features (can modify pagesContent by injecting services)
    // Features are ONLY loaded on initial startup, not on hot reload
    // This is because features may have side effects (e.g., Docker connections)
    if (isInitialLoad && settings.features) {
        await loadFeatures(settings.features, pagesContent);
        console.log('[Config] Features loaded (changes require server restart)');
    } else if (!isInitialLoad && settings.features) {
        console.warn('[Config] Feature changes detected but ignored. Restart server to apply feature changes.');
    }

    const { widgets, statusChecks, serviceWidgetIds, statusCheckIds } = extractWidgets(pagesContent, pagesList);
    const { gadgets, gadgetIds } = extractGadgets(settings);

    updateWidgetConfigs(widgets);
    updateGadgetConfigs(gadgets);
    updateStatusCheckConfigs(statusChecks);
    setCachedConfig({
        settings,
        pagesContent,
        pagesList,
        widgetIds: serviceWidgetIds,
        statusIds: statusCheckIds,
        gadgetIds,
    });
    
    } catch (error) {
        console.error('[Config] Failed to load configuration:', error);
        // Re-throw on initial load, but not on hot reload
        if (!process.env.AUTO_RELOAD) {
            throw error;
        }
        // On hot reload failure, keep the old configuration
        console.error('[Config] Keeping previous configuration due to error');
    }
}

/**
 * Watch config files and reload configuration on changes (optional)
 * Only used in production mode - Vite dev mode uses the Vite plugin instead
 */
function watchConfigFiles() {
    // Skip in Vite dev mode (handled by Vite plugin in vite.config.ts)
    // DEV is set by SvelteKit in development mode
    if (process.env.DEV === 'true') {
        return;
    }

    // In production, only enable when explicitly requested
    if (process.env.AUTO_RELOAD !== 'true') {
        return;
    }

    console.log('[Config] Auto-reload enabled (production mode)');

    let reloadTimer: NodeJS.Timeout | null = null;
    let isReloading = false;

    const watcher = watch(
        'config/',
        { recursive: true },
        (eventType, filename) => {
            // Ignore non-config files
            if (!filename || !filename.match(/\.(yaml|yml|md)$/)) {
                return;
            }

            // Avoid duplicate reloads
            if (isReloading) {
                return;
            }

            console.log(`[Config] File ${eventType}: ${filename}`);

            // Clear existing timer
            if (reloadTimer) {
                clearTimeout(reloadTimer);
            }

            // Debounce: wait 2 seconds before reloading
            reloadTimer = setTimeout(async () => {
                isReloading = true;
                console.log('[Config] Configuration changed, reloading...');

                try {
                    // Hot reload WITHOUT features (isInitialLoad = false)
                    await loadConfiguration(false);
                    console.log('[Config] Configuration reloaded successfully');
                    console.log('[Config] Note: Browser refresh required to see changes');
                } catch (error) {
                    console.error('[Config] Failed to reload configuration:', error);
                } finally {
                    isReloading = false;
                }
            }, 2000);
        }
    );

    // Handle watcher errors
    watcher.on('error', (error) => {
        console.error('[Config] Watcher error:', error);
    });

    // Cleanup on process exit
    process.on('SIGINT', () => {
        watcher.close();
    });

    process.on('SIGTERM', () => {
        watcher.close();
    });
}

export const init: ServerInit = async () => {
    // Initial configuration load (with features)
    await loadConfiguration(true);

    // Start config file watcher (only if AUTO_RELOAD=true)
    watchConfigFiles();
};