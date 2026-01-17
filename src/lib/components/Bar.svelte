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
    {@const gadgetId = ids[index]}

    {#if item.type === 'group'}
      <!-- Group: render items in a flex container -->
      {@const groupVars = (item.vars || {}) as { items?: GadgetConfig[]; align?: 'left' | 'center' | 'right' }}
      {@const groupItems = groupVars.items || []}
      {@const groupAlign = groupVars.align || 'center'}
      {@const alignClass = groupAlign === 'left' ? 'justify-start' : groupAlign === 'right' ? 'justify-end' : 'justify-center'}
      <div class="flex items-center gap-2 min-w-0 w-full sm:w-auto {alignClass}">
        {#each groupItems as subItem, subIndex (`${gadgetId}-${subIndex}`)}
          {@const SubComponent = getGadgetComponent(subItem.type)}
          {@const subGadgetId = `${gadgetId}-${subIndex}`}
          {#if SubComponent}
            <SubComponent config={subItem} id={subGadgetId} />
          {:else}
            <div class="flex items-center gap-1 text-sm text-destructive">
              <IconAlertCircle class="h-4 w-4" />
              <span class="hidden sm:inline">Unknown: {subItem.type}</span>
            </div>
          {/if}
        {/each}
      </div>
    {:else if item.type === 'spacer'}
      <!-- Spacer: force new line on small screens, fill space on large screens -->
      {@const SpacerComponent = getGadgetComponent(item.type)}
      <div class="w-full sm:w-auto sm:flex-1">
        {#if SpacerComponent}
          <SpacerComponent config={item} id={gadgetId} />
        {/if}
      </div>
    {:else}
      <!-- Regular gadget -->
      {@const GadgetComponent = getGadgetComponent(item.type)}
      {#if GadgetComponent}
        <GadgetComponent config={item} id={gadgetId} />
      {:else}
        <div class="flex items-center gap-1 text-sm text-destructive">
          <IconAlertCircle class="h-4 w-4" />
          <span class="hidden sm:inline">Unknown gadget: {item.type}</span>
        </div>
      {/if}
    {/if}
  {/each}
</div>
