import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { ZodType } from 'zod';
import { cachedFetch } from '$lib/widgets/utils/cache';
import { getFeatureConfig } from './config-store';

export interface CreateFeatureHandlerOptions<TVars, TData> {
  varsSchema?: ZodType<TVars, any, any>;
  fetch: (vars: TVars, context: { id: string; config: { type: string } }) => Promise<TData>;
  cacheTtl?: number | ((vars: TVars) => number);
}

export function createFeatureHandler<TVars = unknown, TData = unknown>(
  options: CreateFeatureHandlerOptions<TVars, TData>
): RequestHandler {
  return async ({ url }) => {
    const id = url.searchParams.get('id');

    if (!id) {
      throw error(400, { message: 'Group id is required' });
    }

    const config = getFeatureConfig(id);
    if (!config) {
      throw error(404, { message: `Feature config not found: ${id}` });
    }

    let vars: TVars;
    if (options.varsSchema) {
      const result = options.varsSchema.safeParse(config.vars ?? {});
      if (!result.success) {
        console.warn(`Invalid vars for feature group ${id}:`, result.error.flatten());
        vars = {} as TVars;
      } else {
        vars = result.data;
      }
    } else {
      vars = (config.vars ?? {}) as TVars;
    }

    const cacheTtl = typeof options.cacheTtl === 'function'
      ? options.cacheTtl(vars)
      : options.cacheTtl ?? 10000;

    const startTime = Date.now();

    try {
      const fetchFn = () => options.fetch(vars, { id, config: { type: config.type } });
      const data = cacheTtl > 0
        ? await cachedFetch<TData>(id, fetchFn, cacheTtl)
        : await fetchFn();

      return json({
        data,
        status: 'online',
        latency: Date.now() - startTime,
        checkedAt: Date.now(),
      });
    } catch (e) {
      console.error(`Feature ${config.type} fetch error:`, e);
      return json({
        data: null,
        status: 'offline',
        latency: Date.now() - startTime,
        checkedAt: Date.now(),
      });
    }
  };
}
