import { browser } from '$app/environment';
import { fetchWidget, createAbortController } from './fetch';
import type { ClientWidgetConfig, WidgetResponse, ServiceStatus } from '../types';
import type { ZodType } from 'zod';
import { dataPool } from '$lib/stores/data-pool.svelte';

/** Widget definition with name and dataSchema for type inference */
export interface WidgetDef<TData = unknown> {
  name: string;
  dataSchema: ZodType<TData>;
}

/**
 * Create widget state with manual lifecycle control
 * Use this when you need fine-grained control over start/stop
 *
 * @example
 * ```svelte
 * const { state, start, stop } = createWidgetState<MyData>('my-widget', () => config);
 * onMount(start);
 * onDestroy(stop);
 * ```
 */
export function createWidgetState<T>(type: string, getConfig: () => ClientWidgetConfig) {
  const state = $state({
    data: null as T | null,
    error: null as string | null,
    loading: true,
    status: 'unknown' as ServiceStatus,
    latency: null as number | null,
  });

  const abortController = createAbortController();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  async function refresh() {
    try {
      const config = getConfig();
      // Only send safe data to server: id for lookup
      const response = await fetchWidget<WidgetResponse<T>>(type, { id: config.id }, {
        signal: abortController.getSignal(),
      });
      state.data = response.data;
      state.status = response.status;
      state.latency = response.latency ?? null;
      state.error = null;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      state.error = e instanceof Error ? e.message : 'Unknown error';
      state.status = 'offline';
    } finally {
      state.loading = false;
    }
  }

  function start() {
    refresh();
    intervalId = setInterval(refresh, getConfig().interval || 10000);
  }

  function stop() {
    if (intervalId) clearInterval(intervalId);
    abortController.abort();
  }

  return { state, refresh, start, stop };
}

export interface WidgetState<T> {
  readonly data: T | null;
  readonly error: string | null;
  readonly loading: boolean;
  readonly status: ServiceStatus;
  readonly latency: number | null;
  refresh: () => Promise<void>;
}

/**
 * Widget state hook with automatic lifecycle management
 * Automatically starts polling on mount and cleans up on destroy
 *
 * Now uses unified data pool for efficient polling and caching.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import widget from './meta';
 *   import { useWidget } from '../utils';
 *
 *   let { config }: Props = $props();
 *   const { data, loading, error, status } = useWidget(widget, () => config);
 * </script>
 *
 * {#if loading}
 *   <Skeleton />
 * {:else if error}
 *   <Error message={error} />
 * {:else if data}
 *   <Row label="Value" value={data.value} />
 * {/if}
 * ```
 */
export function useWidget<TData>(
  widget: WidgetDef<TData>,
  getConfig: () => ClientWidgetConfig
) {
  // Internal state for response metadata
  let status = $state<ServiceStatus>('unknown');
  let latency = $state<number | null>(null);

  // Generate unique key for this widget instance
  const config = getConfig();
  const key = `widget:${widget.name}:${config.id}`;
  const ttl = config.interval || 10000;

  // Subscribe to data pool
  const subscription = dataPool.subscribe<WidgetResponse<TData>>(key, ttl, async () => {
    // Fetcher function called by data pool
    const response = await fetchWidget<WidgetResponse<TData>>(widget.name, { id: config.id });

    // Update metadata (not stored in pool)
    status = response.status;
    latency = response.latency ?? null;

    return response;
  });

  // Auto lifecycle: cleanup on component destroy
  $effect(() => {
    if (!browser) return;

    return () => {
      dataPool.unsubscribe(key);
    };
  });

  // Manual refresh function
  async function refresh() {
    await subscription.refresh();
  }

  // Return getters to maintain reactivity when destructured
  return {
    get data() {
      return subscription.data?.data ?? null;
    },
    get error() {
      return subscription.error;
    },
    get loading() {
      return subscription.loading;
    },
    get status() {
      return status;
    },
    get latency() {
      return latency;
    },
    refresh,
  };
}
