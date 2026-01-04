import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { ServiceStatus } from '$lib/widgets/types';
import { cachedFetch } from '$lib/widgets/utils/cache';
import { getStatusCheckConfig } from '$lib/status-check';

export interface StatusCheckResponse {
  status: ServiceStatus;
  latency: number | null;
  checkedAt: number;
  error?: string;
}

export const GET: RequestHandler = async ({ url }) => {
  const id = url.searchParams.get('id');
  
  if (!id) {
    return json({ error: 'Missing id parameter' }, { status: 400 });
  }

  const config = getStatusCheckConfig(id);
  if (!config) {
    return json({ error: 'Status check config not found' }, { status: 404 });
  }

  // Use cache to prevent multiple clients from hammering the service
  const cacheTtl = config.interval;
  
  const fetchStatus = async (): Promise<StatusCheckResponse> => {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(config.url, {
        method: config.method,
        signal: controller.signal,
        // Ignore SSL errors for internal services
        // @ts-ignore - Node.js specific option
        rejectUnauthorized: false,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      const status: ServiceStatus = response.status === config.expectedStatus ? 'online' : 'offline';

      return {
        status,
        latency,
        checkedAt: Date.now(),
      };
    } catch (e) {
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      return {
        status: 'offline',
        latency,
        checkedAt: Date.now(),
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  };

  try {
    const result = await cachedFetch<StatusCheckResponse>(
      `status-check:${id}`,
      fetchStatus,
      cacheTtl
    );
    return json(result);
  } catch (e) {
    return json({
      status: 'offline',
      latency: null,
      checkedAt: Date.now(),
      error: e instanceof Error ? e.message : 'Unknown error',
    } satisfies StatusCheckResponse);
  }
};
