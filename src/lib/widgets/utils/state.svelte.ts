import { fetchWidget, createAbortController } from './fetch';
import type { ClientWidgetConfig } from '../types';
import type { ZodType } from 'zod';

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
  });

  const abortController = createAbortController();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  async function refresh() {
    try {
      const config = getConfig();
      // Only send safe data to server: id for lookup
      state.data = await fetchWidget<T>(type, { id: config.id }, {
        signal: abortController.getSignal(),
      });
      state.error = null;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      state.error = e instanceof Error ? e.message : 'Unknown error';
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
  refresh: () => Promise<void>;
}

/**
 * Widget state hook with automatic lifecycle management
 * Automatically starts polling on mount and cleans up on destroy
 * 
 * @example
 * ```svelte
 * <script lang="ts">
 *   import widget from './meta';
 *   import { useWidget } from '../utils';
 *   
 *   let { config }: Props = $props();
 *   const { data, loading, error } = useWidget(widget, () => config);
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
  let data = $state<TData | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(true);

  const abortController = createAbortController();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  async function refresh() {
    try {
      const config = getConfig();
      data = await fetchWidget<TData>(widget.name, { id: config.id }, {
        signal: abortController.getSignal(),
      });
      error = null;
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  // Auto lifecycle with $effect
  $effect(() => {
    // Start polling
    refresh();
    intervalId = setInterval(refresh, getConfig().interval || 10000);

    // Cleanup on destroy
    return () => {
      if (intervalId) clearInterval(intervalId);
      abortController.abort();
    };
  });

  // Return getters to maintain reactivity when destructured
  return {
    get data() { return data; },
    get error() { return error; },
    get loading() { return loading; },
    refresh,
  };
}
