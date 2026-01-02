<script lang="ts">
  type Variant = 'default' | 'success' | 'warning' | 'danger';

  interface Props {
    value: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    variant?: Variant;
  }

  let { value, max = 100, label, showValue = true, variant = 'default' }: Props = $props();

  const percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));

  const variantClasses: Record<Variant, string> = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive',
  };

  // Auto-detect variant based on percentage if not specified
  const autoVariant = $derived.by(() => {
    if (variant !== 'default') return variant;
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    return 'default';
  });

  const barClass = $derived(variantClasses[autoVariant]);
</script>

<div class="widget-progress">
  {#if label || showValue}
    <div class="widget-progress-header">
      {#if label}
        <span class="widget-progress-label">{label}</span>
      {/if}
      {#if showValue}
        <span class="widget-progress-value">{percentage.toFixed(0)}%</span>
      {/if}
    </div>
  {/if}
  <div class="widget-progress-track">
    <div class="widget-progress-bar {barClass}" style="width: {percentage}%"></div>
  </div>
</div>

<style>
  .widget-progress {
    @apply space-y-1.5;
  }

  .widget-progress-header {
    @apply flex items-center justify-between text-sm;
  }

  .widget-progress-label {
    @apply text-muted-foreground;
  }

  .widget-progress-value {
    @apply text-foreground font-medium tabular-nums;
  }

  .widget-progress-track {
    @apply h-2 w-full rounded-full bg-muted overflow-hidden;
  }

  .widget-progress-bar {
    @apply h-full rounded-full transition-all duration-300;
  }
</style>
