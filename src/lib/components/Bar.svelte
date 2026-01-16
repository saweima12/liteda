<script lang="ts">
  import type { AddonConfig } from '$lib/addons';
  import { getAddonComponent } from '$lib/addons';
  import IconAlertCircle from '~icons/lucide/alert-circle';

  interface Props {
    items: AddonConfig[];
    ids: string[];
    class?: string;
  }

  let { items, ids, class: className = '' }: Props = $props();
</script>

<div class="flex items-center gap-4 {className}">
  {#each items as item, index (ids[index])}
    {@const AddonComponent = getAddonComponent(item.type)}
    {@const addonId = ids[index]}
    {#if AddonComponent}
      <AddonComponent config={item} id={addonId} />
    {:else}
      <div class="flex items-center gap-1 text-sm text-destructive">
        <IconAlertCircle class="h-4 w-4" />
        <span>Unknown addon: {item.type}</span>
      </div>
    {/if}
  {/each}
</div>
