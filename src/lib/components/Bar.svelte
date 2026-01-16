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

<div class="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 {className}">
  {#each items as item, index (ids[index])}
    {@const GadgetComponent = getGadgetComponent(item.type)}
    {@const gadgetId = ids[index]}
    {@const isResourcesGadget = item.type === 'resources'}
    {@const isSpacerGadget = item.type === 'spacer'}
    {#if GadgetComponent}
      <div class="{isResourcesGadget ? 'flex-1 sm:flex-initial min-w-0' : ''} {isSpacerGadget ? 'basis-full sm:basis-auto sm:flex-1' : ''}">
        <GadgetComponent config={item} id={gadgetId} />
      </div>
    {:else}
      <div class="flex items-center gap-1 text-sm text-destructive">
        <IconAlertCircle class="h-4 w-4" />
        <span class="hidden sm:inline">Unknown gadget: {item.type}</span>
      </div>
    {/if}
  {/each}
</div>
