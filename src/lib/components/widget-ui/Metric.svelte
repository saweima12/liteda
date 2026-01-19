<script lang="ts">
  import type { Component } from 'svelte';
  import IconTrendingUp from '~icons/lucide/trending-up';
  import IconTrendingDown from '~icons/lucide/trending-down';
  import IconMinus from '~icons/lucide/minus';

  type Trend = 'up' | 'down' | 'flat';

  interface Props {
    label: string;
    value: string | number;
    unit?: string;
    icon?: Component;
    trend?: Trend;
    trendValue?: string;
  }

  let { label, value, unit, icon: Icon, trend, trendValue }: Props = $props();

  const trendConfig: Record<Trend, { icon: Component; class: string }> = {
    up: { icon: IconTrendingUp, class: 'text-success' },
    down: { icon: IconTrendingDown, class: 'text-destructive' },
    flat: { icon: IconMinus, class: 'text-muted-foreground' },
  };

  const trendInfo = $derived(trend ? trendConfig[trend] : null);
</script>

<div class="widget-metric">
  <div class="widget-metric-header">
    {#if Icon}
      <Icon class="widget-metric-icon" />
    {/if}
    <span class="widget-metric-label">{label}</span>
  </div>
  <div class="widget-metric-body">
    <span class="widget-metric-value">
      {value}{#if unit}<span class="widget-metric-unit">{unit}</span>{/if}
    </span>
    {#if trendInfo}
      {@const TrendIcon = trendInfo.icon}
      <span class="widget-metric-trend {trendInfo.class}">
        <TrendIcon class="h-3.5 w-3.5" />
        {#if trendValue}
          <span class="text-xs">{trendValue}</span>
        {/if}
      </span>
    {/if}
  </div>
</div>

<style lang="postcss">
  .widget-metric {
    @apply space-y-1;
  }

  .widget-metric-header {
    @apply flex items-center gap-1.5 text-muted-foreground;
  }

  .widget-metric-header :global(.widget-metric-icon) {
    @apply h-3.5 w-3.5;
  }

  .widget-metric-label {
    @apply text-xs font-medium uppercase tracking-wide;
  }

  .widget-metric-body {
    @apply flex items-baseline gap-2;
  }

  .widget-metric-value {
    @apply text-2xl font-bold text-foreground tabular-nums;
  }

  .widget-metric-unit {
    @apply text-sm font-normal text-muted-foreground ml-0.5;
  }

  .widget-metric-trend {
    @apply flex items-center gap-0.5;
  }
</style>
