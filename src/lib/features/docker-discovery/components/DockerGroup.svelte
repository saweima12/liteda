<script lang="ts">
  import { browser } from '$app/environment';
  import type { DockerContainer, DockerServiceInfo, DockerDiscoveryMode } from '../types';
  import ServiceCard from '$lib/components/ServiceCard.svelte';
  import type { ServiceItem } from '$config';

  interface Props {
    config: {
      columns?: number;
      refreshInterval?: number;
      urlTemplate?: string;
      includeLabels?: string[];
      excludeLabels?: string[];
      mode?: 'auto' | 'container' | 'swarm';
      enableEventStream?: boolean;
    };
    group: { name: string; icon?: string };
    groupId: string;
    showName?: boolean;
  }

  let { config, group, groupId, showName = true }: Props = $props();

  // State management (similar to widget pattern)
  let items = $state<(DockerContainer | DockerServiceInfo)[]>([]);
  let mode = $state<DockerDiscoveryMode>('container');
  let loading = $state(true);
  let error = $state<string | null>(null);

  /**
   * Fetch containers or services from API
   * Only passes groupId - server looks up full config with sensitive vars
   */
  async function fetchItems() {
    if (!browser) return;

    try {
      loading = true;

      // SECURITY: Only pass groupId, server retrieves full config
      const url = `/api/features/docker-group?id=${encodeURIComponent(groupId)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      mode = data.data?.mode ?? 'container';
      items = data.data?.items ?? [];
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch items';
      console.error('[DockerGroup] Fetch error:', err);
    } finally {
      loading = false;
    }
  }

  /**
   * Check if item is a service (has replicas property)
   */
  function isService(item: DockerContainer | DockerServiceInfo): item is DockerServiceInfo {
    return 'replicas' in item;
  }

  /**
   * Generate description for item
   */
  function getDescription(item: DockerContainer | DockerServiceInfo): string {
    if (isService(item)) {
      return `${item.image} • ${item.replicas.running}/${item.replicas.desired} replicas`;
    }
    return `${item.image} • ${item.status}`;
  }

  /**
   * Transform items to ServiceItem format
   * ServiceCard will handle URL clicking with target="_blank"
   */
  const serviceItems = $derived.by((): ServiceItem[] =>
    items.map(
      (item): ServiceItem => ({
        name: item.name,
        icon: group.icon,
        description: getDescription(item),
        url: item.url,
        target: '_blank',
      })
    )
  );

  // Responsive grid columns
  const cols = $derived(config.columns ?? 3);
  const gridCols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  };

  /**
   * Polling effect (similar to widget pattern)
   * Fetches immediately and sets up interval
   */
  $effect(() => {
    if (!browser) return;

    fetchItems();
    const interval = setInterval(
      fetchItems,
      config.refreshInterval ?? 30000
    );

    return () => clearInterval(interval);
  });
</script>

<section class="space-y-4">
  {#if showName}
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-foreground flex items-center gap-2">
        {group.name}
        {#if mode === 'swarm'}
          <span class="text-xs font-normal text-muted-foreground">(Swarm)</span>
        {/if}
      </h2>
    </div>
  {/if}

  {#if loading && items.length === 0}
    <!-- Initial loading state -->
    <p class="text-sm text-muted-foreground">Loading {mode === 'swarm' ? 'services' : 'containers'}...</p>
  {:else if error}
    <!-- Error state (similar to widget error handling) -->
    <p class="text-sm text-destructive">{error}</p>
  {:else if serviceItems.length === 0}
    <!-- Empty state -->
    <p class="text-sm text-muted-foreground">No {mode === 'swarm' ? 'services' : 'containers'} found</p>
  {:else}
    <!-- Item grid with clickable cards -->
    <div class="grid gap-4 {gridCols[cols] || gridCols[3]}">
      {#each serviceItems as item (item.name)}
        <ServiceCard service={item} />
      {/each}
    </div>
  {/if}
</section>
