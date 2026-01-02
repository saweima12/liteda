import type { PageServerLoad } from './$types';
import { loadSettings, loadAllPages, extractWidgets, type PageContent, type Page } from '$config';
import { registerWidgetConfig, clearWidgetConfigs } from '$lib/widgets';

export const load: PageServerLoad = async () => {
  const settings = await loadSettings();
  const pagesContent = await loadAllPages(settings);
  
  // Get pages list with defaults
  const pagesList: Page[] = settings.pages || [
    { id: 'home', name: 'Home', icon: 'home', file: 'services.yaml' }
  ];
  
  // Extract widgets and register them server-side
  const { widgets, serviceWidgetIds } = extractWidgets(pagesContent, pagesList);
  
  // Clear old registrations and register new ones
  clearWidgetConfigs();
  for (const [widgetId, config] of widgets) {
    registerWidgetConfig(widgetId, config);
  }
  
  // Convert Map to serializable object
  const pages: Record<string, PageContent> = {};
  for (const [id, content] of pagesContent) {
    pages[id] = content;
  }
  
  // Convert serviceWidgetIds to serializable object
  const widgetIds: Record<string, string> = {};
  for (const [serviceKey, widgetId] of serviceWidgetIds) {
    widgetIds[serviceKey] = widgetId;
  }
  
  return {
    settings,
    pages,
    pagesList,
    widgetIds,
  };
};
