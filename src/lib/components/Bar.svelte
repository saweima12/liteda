<script lang="ts">
  import type { AddonConfig } from '$lib/addons';
  import { getAddonComponent } from '$lib/addons';
  import IconAlertCircle from '~icons/lucide/alert-circle';

  interface Props {
    items: AddonConfig[];
    class?: string;
  }

  let { items, class: className = '' }: Props = $props();
</script>

<div class="flex items-center gap-4 {className}">
  {#each items as item (item.type)}
    {@const AddonComponent = getAddonComponent(item.type)}
    {#if AddonComponent}
      <AddonComponent config={item} />
    {:else}
      <div class="flex items-center gap-1 text-sm text-destructive">
        <IconAlertCircle class="h-4 w-4" />
        <span>Unknown addon: {item.type}</span>
      </div>
    {/if}
  {/each}
</div>
