<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    children: Snippet;
  }

  let { label, children }: Props = $props();
</script>

<div class="widget-cell">
  <div class="widget-cell-value">
    {@render children()}
  </div>
  <div class="widget-cell-label">{label}</div>
</div>

<style lang="postcss">
  .widget-cell {
    @apply text-center p-2 rounded-md bg-muted/50;
  }

  .widget-cell-value {
    @apply text-lg font-bold tabular-nums;
  }

  .widget-cell-label {
    @apply text-xs text-muted-foreground uppercase tracking-wide;
  }
</style>
