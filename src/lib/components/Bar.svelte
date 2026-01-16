<script lang="ts">
  import type { GadgetConfig } from '$lib/gadgets';
  import { getGadgetComponent } from '$lib/gadgets';
  import IconAlertCircle from '~icons/lucide/alert-circle';

  interface Props {
    items: GadgetConfig[];
    ids: string[];
    class?: string;
  }

  let { items, ids, class: className = '' }: Props = $props();
</script>

<div class="flex items-center gap-4 {className}">
  {#each items as item, index (ids[index])}
    {@const GadgetComponent = getGadgetComponent(item.type)}
    {@const gadgetId = ids[index]}
    {#if GadgetComponent}
      <GadgetComponent config={item} id={gadgetId} />
    {:else}
      <div class="flex items-center gap-1 text-sm text-destructive">
        <IconAlertCircle class="h-4 w-4" />
        <span>Unknown gadget: {item.type}</span>
      </div>
    {/if}
  {/each}
</div>
