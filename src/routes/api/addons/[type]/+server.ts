import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hasAddon } from '$lib/addons';

// Auto-scan all addon handlers (exclude _template)
const handlers = import.meta.glob<{ GET?: RequestHandler; POST?: RequestHandler }>(
	['$lib/addons/*/handler.ts', '!$lib/addons/_template/handler.ts'],
	{ eager: true }
);

// Build handler map: { weather: { GET, POST }, resources: { GET, POST }, ... }
const handlerMap = new Map<string, { GET?: RequestHandler; POST?: RequestHandler }>();

for (const [path, module] of Object.entries(handlers)) {
	// Extract addon name from path: /src/lib/addons/weather/handler.ts -> weather
	const match = path.match(/\/addons\/([^/]+)\/handler\.ts$/);
	if (match) {
		handlerMap.set(match[1], {
			GET: module.GET,
			POST: module.POST,
		});
	}
}

export const GET: RequestHandler = async (event) => {
	const { type } = event.params;

	if (!type || !hasAddon(type)) {
		throw error(404, { message: `Addon type '${type}' not found` });
	}

	const handler = handlerMap.get(type);
	if (!handler?.GET) {
		throw error(404, { message: `No GET handler for addon type '${type}'` });
	}

	try {
		return handler.GET(event);
	} catch (e) {
		console.error(`Addon ${type} GET error:`, e);
		throw error(500, {
			message: e instanceof Error ? e.message : 'Failed to fetch addon data',
		});
	}
};

export const POST: RequestHandler = async (event) => {
	const { type } = event.params;

	if (!type || !hasAddon(type)) {
		throw error(404, { message: `Addon type '${type}' not found` });
	}

	const handler = handlerMap.get(type);
	if (!handler?.POST) {
		throw error(404, { message: `No POST handler for addon type '${type}'` });
	}

	try {
		return handler.POST(event);
	} catch (e) {
		console.error(`Addon ${type} POST error:`, e);
		throw error(500, {
			message: e instanceof Error ? e.message : 'Failed to process addon request',
		});
	}
};
