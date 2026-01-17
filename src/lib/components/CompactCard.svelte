<script lang="ts">
  import type { ServiceItem } from '$config';
  import { Card } from './ui';
  import IconExternalLink from '~icons/lucide/external-link';

  interface Props {
    item: ServiceItem;
  }

  function getIconUrl(icon: string | undefined): string | null {
    if (!icon) return null;
    if (icon.startsWith('http://') || icon.startsWith('https://')) return icon;
    if (icon.startsWith('/')) return icon;
    return `https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons/png/${icon}.png`;
  }

  let { item }: Props = $props();

  const iconUrl = $derived(getIconUrl(item.icon));
  const hasUrl = $derived(!!item.url);
</script>

{#snippet cardContent()}
  <div class="flex items-center gap-3">
    <!-- Icon -->
    <div class="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
      {#if iconUrl}
        <img
          src={iconUrl}
          alt=""
          class="w-6 h-6 object-contain"
          onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      {:else}
        <span class="text-primary font-semibold text-sm">
          {item.name.charAt(0).toUpperCase()}
        </span>
      {/if}
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 flex items-center gap-2">
      <span class="font-medium text-foreground truncate">{item.name}</span>
      {#if hasUrl}
        <IconExternalLink class="h-3 w-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      {/if}
    </div>
  </div>
{/snippet}

{#if hasUrl}
  <a
    href={item.url}
    target={item.target}
    rel="noopener noreferrer"
    class="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
  >
    <Card class="px-3 py-1.5 transition-all duration-200 group-hover:shadow-sm group-hover:border-primary/20 group-hover:bg-accent/30">
      {@render cardContent()}
    </Card>
  </a>
{:else}
  <Card class="px-3 py-1.5">
    {@render cardContent()}
  </Card>
{/if}
