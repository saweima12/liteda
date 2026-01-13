<script lang="ts">
  import { t } from '$lib/i18n';

  type StatusType = 'healthy' | 'warning' | 'error' | 'unknown';

  interface Props {
    status: StatusType;
    label?: string;
  }

  let { status, label }: Props = $props();

  const statusConfig: Record<StatusType, { color: string; i18nKey: string }> = {
    healthy: { color: 'bg-success', i18nKey: 'common.status.healthy' },
    warning: { color: 'bg-warning', i18nKey: 'common.status.warning' },
    error: { color: 'bg-destructive', i18nKey: 'common.status.error' },
    unknown: { color: 'bg-muted-foreground', i18nKey: 'common.status.unknown' },
  };

  const config = $derived(statusConfig[status]);
  const displayLabel = $derived(label ?? $t(config.i18nKey));
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
