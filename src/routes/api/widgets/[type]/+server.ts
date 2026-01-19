import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hasWidget } from '$lib/widgets';

// Auto-scan all widget handlers (exclude _template)
const handlers = import.meta.glob<{ POST: RequestHandler }>(
  ['$lib/widgets/*/handler.server.ts', '!$lib/widgets/_template/handler.server.ts'],
  { eager: true }
);

// Build handler map: { demo: POST, docker: POST, ... }
const handlerMap = new Map<string, RequestHandler>();

for (const [path, module] of Object.entries(handlers)) {
  
  const match = path.match(/\/widgets\/([^/]+)\/handler\.server\.ts$/);
  if (match && module.POST) {
    handlerMap.set(match[1], module.POST);
  }
}

export const POST: RequestHandler = async (event) => {
  const { type } = event.params;

  if (!type || !hasWidget(type)) {
    throw error(404, { message: `Widget type '${type}' not found` });
  }

  const handler = handlerMap.get(type);
  if (!handler) {
    throw error(404, { message: `No handler for widget type '${type}'` });
  }

  try {
    return handler(event);
  } catch (e) {
    console.error(`Widget ${type} error:`, e);
    throw error(500, {
      message: e instanceof Error ? e.message : 'Failed to fetch widget data',
    });
  }
};
