<script lang="ts">
  import type { ClientWidgetConfig, ServiceStatus } from '$lib/widgets/types';
  import { getWidgetComponent } from '$lib/widgets';
  import { t } from '$lib/i18n';
  import IconAlertCircle from '~icons/lucide/alert-circle';

  interface Props {
    config: ClientWidgetConfig;
    onStatus?: (event: CustomEvent<{ status: ServiceStatus; latency: number | null }>) => void;
  }

  let { config, onStatus }: Props = $props();

  const WidgetComponent = $derived(getWidgetComponent(config.type));
</script>

{#if WidgetComponent}
  <WidgetComponent {config} {onStatus} />
{:else}
  <div class="flex items-center gap-2 text-sm text-muted-foreground">
    <IconAlertCircle class="h-4 w-4" />
    <span>{$t('common.errors.unknown_widget', { type: config.type })}</span>
  </div>
{/if}
