import type { ServerInit } from '@sveltejs/kit';
import { loadSettings, loadAllPages, extractWidgets, extractAddons, setCachedConfig, type Page } from '$config';
import { updateWidgetConfigs } from '$lib/widgets';
import { updateAddonConfigs } from '$lib/addons/config-store';
import { updateStatusCheckConfigs } from '$lib/status-check';
import { initI18n } from '$lib/i18n';

export const init: ServerInit = async () => {
    const settings = await loadSettings();

    // Initialize i18n with locale from settings
    const locale = settings.i18n?.locale || 'en';
    await initI18n(locale);

    const pagesContent = await loadAllPages(settings);
    const pagesList: Page[] = settings.pages || [
        { id: 'home', name: 'Home', icon: 'home', file: 'services.yaml' }
    ];

    const { widgets, statusChecks, serviceWidgetIds, statusCheckIds } = extractWidgets(pagesContent, pagesList);
    const { addons, addonIds } = extractAddons(settings);

    updateWidgetConfigs(widgets);
    updateAddonConfigs(addons);
    updateStatusCheckConfigs(statusChecks);

    setCachedConfig({
        settings,
        pagesContent,
        pagesList,
        widgetIds: serviceWidgetIds,
        statusIds: statusCheckIds,
        addonIds,
    });
};