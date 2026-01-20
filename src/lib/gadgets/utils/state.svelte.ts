import { browser } from '$app/environment';
import { dataPool } from '$lib/stores/data-pool.svelte';

/**
 * Hook for gadget state management with unified data pool
 *
 * Optional helper for gadgets. Existing gadgets can continue using
 * their own $effect + setInterval pattern, but new gadgets can use
 * this for automatic optimization.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useGadget } from '../utils/state.svelte';
 *
 *   let { config, id }: Props = $props();
 *   const { data, loading, error, refresh } = useGadget<WeatherData>(
 *     'weather',
 *     id,
 *     config.vars.refresh || 600000
 *   );
 * </script>
 *
 * {#if loading}
 *   <Loader />
 * {:else if error}
 *   <Error message={error} />
 * {:else if data}
 *   <div>{data.temperature}°C</div>
 * {/if}
 * ```
 */
export function useGadget<TData>(
  type: string,
  id: string,
  refreshInterval: number = 10000
) {
  // Generate unique key for this gadget instance
  const key = `gadget:${type}:${id}`;

  // Subscribe to data pool
  const subscription = dataPool.subscribe<TData>(key, refreshInterval, async () => {
    // Fetcher function called by data pool
    const response = await fetch(`/api/gadgets/${type}?id=${encodeURIComponent(id)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch ${type} gadget`);
    }

    return response.json();
  });

  // Auto lifecycle: cleanup on component destroy
  $effect(() => {
    if (!browser) return;

    return () => {
      dataPool.unsubscribe(key);
    };
  });

  // Return getters to maintain reactivity when destructured
  return {
    get data() {
      return subscription.data;
    },
    get error() {
      return subscription.error;
    },
    get loading() {
      return subscription.loading;
    },
    refresh: subscription.refresh,
  };
}
