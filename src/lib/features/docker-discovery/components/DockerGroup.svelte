<script lang="ts">
  import { browser } from '$app/environment';
  import type { DockerContainer } from '../types';
  import ServiceCard from '$lib/components/ServiceCard.svelte';
  import type { ServiceItem } from '$config';

  interface Props {
    config: {
      columns?: number;
      refreshInterval?: number;
      urlTemplate?: string;
      includeLabels?: string[];
      excludeLabels?: string[];
    };
    group: { name: string; icon?: string };
    groupId: string;
    showName?: boolean;
  }

  let { config, group, groupId, showName = true }: Props = $props();

  // State management (similar to widget pattern)
  let containers = $state<DockerContainer[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  /**
   * Fetch containers from API
   * Only passes groupId - server looks up full config with sensitive vars
   */
  async function fetchContainers() {
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
      containers = data.data?.containers ?? [];
      error = null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to fetch containers';
      console.error('[DockerGroup] Fetch error:', err);
    } finally {
      loading = false;
    }
  }

  /**
   * Resolve URL for container using template
   * Server also applies this, but we keep it for consistency
   * NOTE: Server-provided URLs take precedence
   */
  function resolveUrl(container: DockerContainer): string | undefined {
    // Use server-provided URL if available
    if (container.url) return container.url;

    // Fallback: client-side URL resolution (for backwards compatibility)
    if (!config.urlTemplate) return undefined;

    return config.urlTemplate
      .replace('{name}', container.name)
      .replace('{id}', container.id)
      .replace('{image}', container.image)
      .replace('{state}', container.state);
  }

  /**
   * Transform containers to ServiceItem format
   * ServiceCard will handle URL clicking with target="_blank"
   */
  const items = $derived.by((): ServiceItem[] =>
    containers.map(
      (container): ServiceItem => ({
        name: container.name,
        icon: group.icon,
        description: `${container.image} • ${container.status}`,
        url: resolveUrl(container),
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

    fetchContainers();
    const interval = setInterval(
      fetchContainers,
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
      </h2>
    </div>
  {/if}

  {#if loading && containers.length === 0}
    <!-- Initial loading state -->
    <p class="text-sm text-muted-foreground">Loading containers...</p>
  {:else if error}
    <!-- Error state (similar to widget error handling) -->
    <p class="text-sm text-destructive">{error}</p>
  {:else if items.length === 0}
    <!-- Empty state -->
    <p class="text-sm text-muted-foreground">No containers found</p>
  {:else}
    <!-- Container grid with clickable cards -->
    <div class="grid gap-4 {gridCols[cols] || gridCols[3]}">
      {#each items as item (item.name)}
        <ServiceCard service={item} />
      {/each}
    </div>
  {/if}
</section>
