import type { PageServerLoad } from './$types';
import { getCachedConfig, type PageContent } from '$config';

export const load: PageServerLoad = async () => {
  const { settings, pagesContent, pagesList, widgetIds, statusIds, gadgetIds } = getCachedConfig();

  const pages: Record<string, PageContent> = Object.fromEntries(pagesContent);
  const widgetIdsObj: Record<string, string> = Object.fromEntries(widgetIds);
  const statusIdsObj: Record<string, string> = Object.fromEntries(statusIds);

  return {
    settings,
    pages,
    pagesList,
    widgetIds: widgetIdsObj,
    statusIds: statusIdsObj,
    gadgetIds,
  };
};
