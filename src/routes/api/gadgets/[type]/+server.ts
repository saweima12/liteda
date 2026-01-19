import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hasGadget } from '$lib/gadgets';

// Auto-scan all gadget handlers (exclude _template)
const handlers = import.meta.glob<{ GET?: RequestHandler; POST?: RequestHandler }>(
	['$lib/gadgets/*/handler.server.ts', '!$lib/gadgets/_template/handler.server.ts'],
	{ eager: true }
);

// Build handler map: { weather: { GET, POST }, resources: { GET, POST }, ... }
const handlerMap = new Map<string, { GET?: RequestHandler; POST?: RequestHandler }>();

for (const [path, module] of Object.entries(handlers)) {
	
	const match = path.match(/\/gadgets\/([^/]+)\/handler\.server\.ts$/);
	if (match) {
		handlerMap.set(match[1], {
			GET: module.GET,
			POST: module.POST,
		});
	}
}

export const GET: RequestHandler = async (event) => {
	const { type } = event.params;

	if (!type || !hasGadget(type)) {
		throw error(404, { message: `Gadget type '${type}' not found` });
	}

	const handler = handlerMap.get(type);
	if (!handler?.GET) {
		throw error(404, { message: `No GET handler for gadget type '${type}'` });
	}

	try {
		return handler.GET(event);
	} catch (e) {
		console.error(`Gadget ${type} GET error:`, e);
		throw error(500, {
			message: e instanceof Error ? e.message : 'Failed to fetch gadget data',
		});
	}
};

export const POST: RequestHandler = async (event) => {
	const { type } = event.params;

	if (!type || !hasGadget(type)) {
		throw error(404, { message: `Gadget type '${type}' not found` });
	}

	const handler = handlerMap.get(type);
	if (!handler?.POST) {
		throw error(404, { message: `No POST handler for gadget type '${type}'` });
	}

	try {
		return handler.POST(event);
	} catch (e) {
		console.error(`Gadget ${type} POST error:`, e);
		throw error(500, {
			message: e instanceof Error ? e.message : 'Failed to process gadget request',
		});
	}
};
