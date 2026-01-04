import type { ServerInit } from '@sveltejs/kit';
import { loadSettings, loadAllPages, extractWidgets, setCachedConfig, type Page } from '$config';
import { updateWidgetConfigs } from '$lib/widgets';
import { updateStatusCheckConfigs } from '$lib/status-check';

export const init: ServerInit = async () => {
    const settings = await loadSettings();
    const pagesContent = await loadAllPages(settings);
    const pagesList: Page[] = settings.pages || [
        { id: 'home', name: 'Home', icon: 'home', file: 'services.yaml' }
    ];

    const { widgets, statusChecks, serviceWidgetIds, statusCheckIds } = extractWidgets(pagesContent, pagesList);
    
    updateWidgetConfigs(widgets);
    updateStatusCheckConfigs(statusChecks);
    
    setCachedConfig({
        settings,
        pagesContent,
        pagesList,
        widgetIds: serviceWidgetIds,
        statusIds: statusCheckIds,
    });
};