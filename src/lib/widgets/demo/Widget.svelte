<script lang="ts">
  import type { WidgetProps } from '../types';
  import widgetDef from './meta';
  import { useWidget } from '../utils';
  import { Block, Cell } from '$components/widget-ui';
  import { Skeleton } from '$components/ui';
  import IconAlertCircle from '~icons/lucide/alert-circle';

  let { config, onStatus }: WidgetProps = $props();

  // Don't destructure - it breaks reactivity
  const widget = useWidget(widgetDef, () => config);

  // Emit status changes
  $effect(() => {
    if (onStatus) {
      onStatus(new CustomEvent('status', { 
        detail: { status: widget.status, latency: widget.latency } 
      }));
    }
  });
</script>

<Block>
  {#if widget.loading && !widget.data}
    <div class="space-y-2">
      <Skeleton class="h-4 w-20" />
      <Skeleton class="h-4 w-32" />
      <Skeleton class="h-4 w-24" />
    </div>
  {:else if widget.error}
    <div class="flex items-center gap-2 text-destructive text-sm">
      <IconAlertCircle class="h-4 w-4" />
      <span>{widget.error}</span>
    </div>
  {:else if widget.data}
    <Block layout="grid" columns={3}>
      <Cell label="Random">{widget.data.randomValue}</Cell>
      <Cell label="API Key">{widget.data.hasApiKey ? '✓' : '✗'}</Cell>
      <Cell label="Endpoint">{widget.data.hasCustomEndpoint ? '✓' : '✗'}</Cell>
    </Block>
  {/if}
</Block>
