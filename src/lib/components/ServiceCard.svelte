<script lang="ts">
  import type { ServiceItem } from '$config';
  import type { ClientWidgetConfig, ServiceStatus } from '$lib/widgets/types';
  import { browser } from '$app/environment';
  import { Card, Skeleton } from './ui';
  import WidgetContainer from './WidgetContainer.svelte';
  import StatusIndicator from './StatusIndicator.svelte';
  import IconExternalLink from '~icons/lucide/external-link';
  import IconLink from '~icons/lucide/link';
  import { getIconUrl } from '$lib/utils/icons';

  interface Props {
    service: ServiceItem;
    widgetId?: string;
    statusCheckId?: string;
    equalHeight?: boolean;
  }

  let { service, widgetId, statusCheckId, equalHeight = true }: Props = $props();

  const iconUrl = $derived(getIconUrl(service.icon));
  const hasUrl = $derived(!!service.url);
  const heightClass = $derived(equalHeight ? 'h-full' : '');
  const hasStatusCheck = $derived(!!service.statuscheck);

  // Create client-safe widget config (no vars!)
  const clientWidgetConfig = $derived.by((): ClientWidgetConfig | undefined => {
    if (!service.widget || !widgetId) return undefined;
    return {
      type: service.widget.type,
      interval: service.widget.interval,
      id: widgetId,
    };
  });

  // Status from widget (passed up via event)
  let widgetStatus = $state<ServiceStatus | null>(null);
  let widgetLatency = $state<number | null>(null);

  function handleWidgetStatus(event: CustomEvent<{ status: ServiceStatus; latency: number | null }>) {
    widgetStatus = event.detail.status;
    widgetLatency = event.detail.latency;
  }

  // Determine if we should show status indicator
  // Show if: has widget OR has statusCheck
  const showStatus = $derived(!!clientWidgetConfig || hasStatusCheck);

  // Check if service has links
  const hasLinks = $derived(!!(service.links && service.links.length > 0));

  // Track if links section is hydrated to prevent layout shift
  let linksHydrated = $state(false);

  // Hydrate links on client to prevent layout shift during SSR
  $effect(() => {
    if (browser && hasLinks) {
      linksHydrated = true;
    }
  });
</script>

{#snippet cardContent()}
  <div class="flex items-start gap-3 relative">
    <!-- Status Indicator (top right) -->
    {#if showStatus}
      <div class="absolute -top-1 -right-1">
        {#if clientWidgetConfig}
          <!-- Widget provides status -->
          <StatusIndicator status={widgetStatus ?? 'unknown'} latency={widgetLatency} />
        {:else if statusCheckId}
          <!-- Standalone status check -->
          <StatusIndicator checkId={statusCheckId} interval={typeof service.statuscheck === 'object' ? service.statuscheck.interval : 60000} />
        {/if}
      </div>
    {/if}

    <!-- Icon -->
    {#if iconUrl}
      <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
        <img
          src={iconUrl}
          alt={service.name}
          class="w-6 h-6 object-contain"
          onerror={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    {:else}
      <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <span class="text-primary font-semibold text-sm">
          {service.name.charAt(0).toUpperCase()}
        </span>
      </div>
    {/if}

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-medium text-foreground truncate">{service.name}</span>
        {#if hasUrl}
          <IconExternalLink class="h-3 w-3 text-muted-foreground flex-shrink-0" />
        {/if}
      </div>

      {#if service.description}
        <p class="text-sm text-muted-foreground mt-0.5 truncate">
          {service.description}
        </p>
      {/if}

      <!-- Widget -->
      {#if clientWidgetConfig}
        <div class="mt-3 pt-3 border-t border-border">
          <WidgetContainer config={clientWidgetConfig} onStatus={handleWidgetStatus} />
        </div>
      {/if}

      <!-- Sub-links with skeleton loading transition -->
      {#if hasLinks}
        <div class="mt-3 pt-3 border-t border-border">
          {#if !linksHydrated}
            <!-- Skeleton placeholder to reserve space during SSR/hydration -->
            <div class="flex flex-wrap gap-2">
              {#each service.links as _}
                <Skeleton class="h-8 w-20 rounded-md" />
              {/each}
            </div>
          {:else}
            <!-- Actual links -->
            <div class="flex flex-wrap gap-2">
              {#each service.links as link}
                <a
                  href={link.url}
                  target={link.target}
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onclick={(e) => e.stopPropagation()}
                >
                  <span class="inline-flex items-center justify-center w-3 h-3 flex-shrink-0">
                    {#if link.icon}
                      <img
                        src={getIconUrl(link.icon)}
                        alt=""
                        class="w-full h-full object-contain"
                        onerror={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          const parent = img.parentElement;
                          if (parent) {
                            parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
                          }
                        }}
                      />
                    {:else}
                      <IconLink class="w-3 h-3" />
                    {/if}
                  </span>
                  <span>{link.name}</span>
                </a>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/snippet}

{#if hasUrl}
  <a
    href={service.url}
    target={service.target}
    rel="noopener noreferrer"
    class="block {heightClass} group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
  >
    <Card class="{heightClass} p-4 transition-all duration-200 group-hover:shadow-md group-hover:border-primary/20 group-hover:bg-accent/30">
      {@render cardContent()}
    </Card>
  </a>
{:else}
  <Card class="{heightClass} p-4">
    {@render cardContent()}
  </Card>
{/if}
