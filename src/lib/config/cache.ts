import type { Settings, Page, PageContent } from './schema';

// Cached server-side data (loaded once at startup)
let cachedSettings: Settings;
let cachedPagesContent: Map<string, PageContent>;
let cachedPagesList: Page[];
let cachedWidgetIds: Map<string, string>;
let cachedStatusIds: Map<string, string>;

export function setCachedConfig(config: {
    settings: Settings;
    pagesContent: Map<string, PageContent>;
    pagesList: Page[];
    widgetIds: Map<string, string>;
    statusIds: Map<string, string>;
}) {
    cachedSettings = config.settings;
    cachedPagesContent = config.pagesContent;
    cachedPagesList = config.pagesList;
    cachedWidgetIds = config.widgetIds;
    cachedStatusIds = config.statusIds;
}

export function getCachedConfig() {
    return {
        settings: cachedSettings,
        pagesContent: cachedPagesContent,
        pagesList: cachedPagesList,
        widgetIds: cachedWidgetIds,
        statusIds: cachedStatusIds,
    };
}
