<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    layout?: 'stack' | 'grid';
    columns?: 2 | 3 | 4;
    children?: Snippet;
  }

  let { title, layout = 'stack', columns = 4, children }: Props = $props();

  const gridCols: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  const contentClass = $derived(
    layout === 'grid' 
      ? `grid ${gridCols[columns]} gap-2` 
      : 'space-y-1.5'
  );
</script>

<div class="widget-block">
  {#if title}
    <div class="widget-block-title">{title}</div>
  {/if}
  {#if children}
    <div class={contentClass}>
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .widget-block {
    @apply space-y-2;
  }
  
  .widget-block-title {
    @apply text-xs font-medium text-muted-foreground uppercase tracking-wide;
  }
</style>
