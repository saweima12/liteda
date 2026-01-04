<script lang="ts">
  import type { ServiceItem } from '$config';
  import type { ClientWidgetConfig } from '$lib/widgets/types';
  import { Card } from './ui';
  import WidgetContainer from './WidgetContainer.svelte';
  import IconExternalLink from '~icons/lucide/external-link';

  interface Props {
    service: ServiceItem;
    widgetId?: string;
  }

  function getIconUrl(icon: string | undefined): string | null {
    if (!icon) return null;
    if (icon.startsWith('http://') || icon.startsWith('https://')) return icon;
    if (icon.startsWith('/')) return icon;
    return `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${icon}.png`;
  }

  let { service, widgetId }: Props = $props();

  const iconUrl = $derived(getIconUrl(service.icon));
  const hasUrl = $derived(!!service.url);

  // Create client-safe widget config (no vars!)
  const clientWidgetConfig = $derived.by((): ClientWidgetConfig | undefined => {
    if (!service.widget || !widgetId) return undefined;
    return {
      type: service.widget.type,
      interval: service.widget.interval,
      id: widgetId,
    };
  });
</script>

{#snippet cardContent()}
  <div class="flex items-start gap-3">
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
          <WidgetContainer config={clientWidgetConfig} />
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
    class="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
  >
    <Card class="p-4 transition-all duration-200 group-hover:shadow-md group-hover:border-primary/20 group-hover:bg-accent/30">
      {@render cardContent()}
    </Card>
  </a>
{:else}
  <Card class="p-4">
    {@render cardContent()}
  </Card>
{/if}
