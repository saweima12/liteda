import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { ZodType, z } from 'zod';
import { getWidgetConfig } from '../config-store';
import { cachedFetch } from './cache';

export interface CreateHandlerOptions<TVars, TData> {
  /**
   * Zod schema for validating vars from config
   * If not provided, vars will be passed as-is
   */
  varsSchema?: ZodType<TVars>;

  /**
   * Fetch function that receives validated vars and returns widget data
   * This is where you implement your widget's data fetching logic
   */
  fetch: (vars: TVars, context: { id: string; config: { type: string; interval?: number } }) => Promise<TData>;

  /**
   * Cache TTL in milliseconds
   * If not provided, uses the widget's interval or default (5000ms)
   * Set to 0 to disable caching for this handler
   */
  cacheTtl?: number;
}

/**
 * Create a standardized widget handler with minimal boilerplate
 * 
 * Features:
 * - Automatic caching with TTL (prevents duplicate requests from multiple clients)
 * - Thundering herd prevention
 * - Zod validation for vars
 * 
 * @example
 * ```ts
 * // widgets/my-widget/handler.ts
 * import { createHandler } from '../utils/create-handler';
 * import { varsSchema, type MyWidgetData } from './meta';
 * 
 * export const POST = createHandler<typeof varsSchema, MyWidgetData>({
 *   varsSchema,
 *   async fetch(vars) {
 *     const res = await fetch(vars.endpoint);
 *     return res.json();
 *   },
 * });
 * ```
 */
export function createHandler<TVars = unknown, TData = unknown>(
  options: CreateHandlerOptions<TVars, TData>
): RequestHandler {
  return async ({ request }) => {
    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { id } = body as { id?: string };

    if (!id) {
      throw error(400, { message: 'Widget ID is required' });
    }

    // Get full config from server-side store
    const config = getWidgetConfig(id);
    if (!config) {
      throw error(404, { message: `Widget config not found: ${id}` });
    }

    // Validate vars if schema provided
    let vars: TVars;
    if (options.varsSchema) {
      const result = options.varsSchema.safeParse(config.vars);
      if (!result.success) {
        console.warn(`Invalid vars for widget ${id}:`, result.error.flatten());
        // Use empty object as fallback for optional schemas
        vars = {} as TVars;
      } else {
        vars = result.data;
      }
    } else {
      vars = (config.vars ?? {}) as TVars;
    }

    // Determine cache TTL
    // Priority: widget interval > handler option > default (5000ms)
    const cacheTtl = config.interval ?? options.cacheTtl ??  5000;

    // Call the fetch function with caching
    try {
      const fetchFn = () => options.fetch(vars, {
        id,
        config: { type: config.type, interval: config.interval },
      });

      // Use cache if TTL > 0
      const data = cacheTtl > 0
        ? await cachedFetch<TData>(id, fetchFn, cacheTtl)
        : await fetchFn();

      return json(data);
    } catch (e) {
      console.error(`Widget ${config.type} fetch error:`, e);
      throw error(500, {
        message: e instanceof Error ? e.message : 'Failed to fetch widget data',
      });
    }
  };
}
