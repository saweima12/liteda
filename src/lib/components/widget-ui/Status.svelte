<script lang="ts">
  type StatusType = 'healthy' | 'warning' | 'error' | 'unknown';

  interface Props {
    status: StatusType;
    label?: string;
  }

  let { status, label }: Props = $props();

  const statusConfig: Record<StatusType, { color: string; defaultLabel: string }> = {
    healthy: { color: 'bg-success', defaultLabel: 'Healthy' },
    warning: { color: 'bg-warning', defaultLabel: 'Warning' },
    error: { color: 'bg-destructive', defaultLabel: 'Error' },
    unknown: { color: 'bg-muted-foreground', defaultLabel: 'Unknown' },
  };

  const config = $derived(statusConfig[status]);
  const displayLabel = $derived(label ?? config.defaultLabel);
</script>

<div class="widget-status">
  <span class="widget-status-dot {config.color}"></span>
  <span class="widget-status-label">{displayLabel}</span>
</div>

<style>
  .widget-status {
    @apply flex items-center gap-2 text-sm;
  }

  .widget-status-dot {
    @apply h-2 w-2 rounded-full flex-shrink-0;
  }

  .widget-status-label {
    @apply text-foreground capitalize;
  }
</style>
