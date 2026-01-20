<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Skeleton } from '$components/ui';

  interface Props {
    title?: string;
    layout?: 'stack' | 'grid';
    columns?: 2 | 3 | 4;
    children?: Snippet;
    loading?: boolean;
    skeletonCount?: number;
  }

  let { title, layout = 'stack', columns = 4, children, loading = false, skeletonCount = 3 }: Props = $props();

  const gridCols: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };

  const contentClass = $derived(
    layout === 'grid'
      ? `grid ${gridCols[columns]} gap-1.5 sm:gap-2`
      : 'space-y-1.5'
  );

  // Skeleton class based on layout
  const skeletonClass = $derived(layout === 'grid' ? 'h-16' : 'h-8');
</script>

<div class="widget-block">
  {#if title}
    <div class="widget-block-title">{title}</div>
  {/if}
  {#if loading}
    <div class={contentClass}>
      {#each Array(skeletonCount) as _}
        <Skeleton class={skeletonClass} />
      {/each}
    </div>
  {:else if children}
    <div class={contentClass}>
      {@render children()}
    </div>
  {/if}
</div>

<style lang="postcss">
  .widget-block {
    @apply space-y-2;
  }
  
  .widget-block-title {
    @apply text-xs font-medium text-muted-foreground uppercase tracking-wide;
  }
</style>
