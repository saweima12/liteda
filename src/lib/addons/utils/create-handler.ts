import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { ZodType } from 'zod';
import { getAddonConfig } from '../config-store';
import { cachedFetch } from '$lib/widgets/utils/cache';

export interface CreateAddonHandlerOptions<TVars, TData> {
	/**
	 * Zod schema for validating vars from config
	 * If not provided, vars will be passed as-is
	 */
	varsSchema?: ZodType<TVars>;

	/**
	 * Fetch function that receives validated vars and returns addon data
	 * This is where you implement your addon's data fetching logic
	 */
	fetch: (vars: TVars, context: { id: string; config: { type: string } }) => Promise<TData>;

	/**
	 * Cache TTL in milliseconds
	 * Can be a number or a function that receives vars
	 * If not provided, no caching is applied
	 * Set to 0 to disable caching
	 */
	cacheTtl?: number | ((vars: TVars) => number);

	/**
	 * Custom cache key generator
	 * If not provided, uses addon ID as cache key
	 */
	getCacheKey?: (vars: TVars, id: string) => string;
}

/**
 * Create a standardized addon GET handler with minimal boilerplate
 *
 * Features:
 * - Automatic caching with TTL
 * - Thundering herd prevention
 * - Zod validation for vars
 * - Server-side config lookup (vars never exposed to client)
 * - GET method with ID query parameter
 *
 * @example
 * ```ts
 * // addons/weather/handler.ts
 * import { createAddonHandler } from '$lib/addons/utils/create-handler';
 * import { weatherVarsSchema, type WeatherData } from './types';
 *
 * export const GET = createAddonHandler({
 *   varsSchema: weatherVarsSchema,
 *   async fetch(vars) {
 *     const res = await fetch(`https://api.example.com/weather?lat=${vars.latitude}`);
 *     return res.json();
 *   },
 *   cacheTtl: (vars) => vars.cache * 60 * 1000,
 *   getCacheKey: (vars) => `weather:${vars.latitude},${vars.longitude}`,
 * });
 *
 * // Client-side usage:
 * // fetch(`/api/addons/weather?id=${addonId}`)
 * ```
 */
export function createAddonHandler<TVars = unknown, TData = unknown>(
	options: CreateAddonHandlerOptions<TVars, TData>
): RequestHandler {
	return async ({ url }) => {
		// Parse query parameter
		const id = url.searchParams.get('id');

		if (!id) {
			throw error(400, { message: 'Addon ID is required' });
		}

		// Get full config from server-side store
		const config = getAddonConfig(id);
		if (!config) {
			throw error(404, { message: `Addon config not found: ${id}` });
		}

		// Validate vars if schema provided
		let vars: TVars;
		if (options.varsSchema) {
			const result = options.varsSchema.safeParse(config.vars);
			if (!result.success) {
				console.warn(`Invalid vars for addon ${id}:`, result.error.flatten());
				// Use empty object as fallback for optional schemas
				vars = {} as TVars;
			} else {
				vars = result.data;
			}
		} else {
			vars = (config.vars ?? {}) as TVars;
		}

		// Generate cache key
		const cacheKey = options.getCacheKey
			? options.getCacheKey(vars, id)
			: `addon:${id}`;

		// Calculate cache TTL
		const ttl =
			typeof options.cacheTtl === 'function' ? options.cacheTtl(vars) : options.cacheTtl;

		// Execute fetch with optional caching
		try {
			const fetchFn = () => options.fetch(vars, {
				id,
				config: { type: config.type },
			});

			const data =
				ttl && ttl > 0 ? await cachedFetch<TData>(cacheKey, fetchFn, ttl) : await fetchFn();

			return json(data);
		} catch (e) {
			console.error(`Addon ${config.type} fetch error:`, e);
			throw error(500, {
				message: e instanceof Error ? e.message : 'Failed to fetch addon data',
			});
		}
	};
}
