<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Skeleton } from '$components/ui';

  interface Props {
    label: string;
    children: Snippet;
    loading?: boolean;
  }

  let { label, children, loading = false }: Props = $props();
</script>

{#if loading}
  <div class="widget-cell">
    <Skeleton class="h-6 w-12 mx-auto" />
    <Skeleton class="h-3 w-16 mx-auto" />
  </div>
{:else}
  <div class="widget-cell">
    <div class="widget-cell-value">
      {@render children()}
    </div>
    <div class="widget-cell-label">{label}</div>
  </div>
{/if}

<style lang="postcss">
  .widget-cell {
    @apply text-center p-1.5 sm:p-2 rounded-md bg-muted/50 overflow-hidden min-w-0;
  }

  .widget-cell-value {
    @apply text-xs sm:text-sm font-bold tabular-nums leading-tight;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  .widget-cell-label {
    @apply text-[0.625rem] sm:text-xs text-muted-foreground uppercase tracking-wide truncate mt-1;
  }
</style>
