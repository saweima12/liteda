<script lang="ts">
  import type { Component } from 'svelte';

  interface Props {
    label: string;
    value: string | number;
    icon?: Component;
    hint?: string;
  }

  let { label, value, icon: Icon, hint }: Props = $props();
</script>

<div class="widget-row">
  <div class="widget-row-label">
    {#if Icon}
      <Icon class="widget-row-icon" />
    {/if}
    <span>{label}</span>
  </div>
  <div class="widget-row-value" title={hint}>
    {value}
  </div>
</div>

<style lang="postcss">
  .widget-row {
    @apply flex items-center justify-between gap-2 text-sm;
  }
  
  .widget-row-label {
    @apply flex items-center gap-1.5 text-muted-foreground;
  }
  
  .widget-row-label :global(.widget-row-icon) {
    @apply h-3.5 w-3.5 flex-shrink-0;
  }
  
  .widget-row-value {
    @apply text-foreground font-medium tabular-nums;
  }
</style>
