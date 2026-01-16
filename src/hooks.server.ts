import type { ServerInit } from '@sveltejs/kit';
import { loadSettings, loadAllPages, extractWidgets, extractGadgets, setCachedConfig, type Page } from '$config';
import { updateWidgetConfigs } from '$lib/widgets';
import { updateGadgetConfigs } from '$lib/gadgets/config-store';
import { updateStatusCheckConfigs } from '$lib/status-check';
import { initI18n } from '$lib/i18n';
import { loadFeatures } from '$lib/features';

export const init: ServerInit = async () => {
    const settings = await loadSettings();

    // Initialize i18n with locale from settings
    const locale = settings.i18n?.locale || 'en';
    await initI18n(locale);

    const pagesContent = await loadAllPages(settings);
    const pagesList: Page[] = settings.pages || [
        { id: 'home', name: 'Home', icon: 'home', file: 'services.yaml' }
    ];

    // Load features (can modify pagesContent by injecting services)
    if (settings.features) {
        await loadFeatures(settings.features, pagesContent);
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
};