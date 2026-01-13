<script lang="ts">
  import type { ClientWidgetConfig } from '../types';
  import widgetDef from './meta';
  import { useWidget } from '../utils';
  import { wt } from '../utils/i18n';
  import { Block, Cell } from '$components/widget-ui';
  import { Skeleton } from '$components/ui';
  import IconAlertCircle from '~icons/lucide/alert-circle';

  interface Props {
    config: ClientWidgetConfig;
  }

  let { config }: Props = $props();

  const widget = useWidget(widgetDef, () => config);
  const tw = wt(widgetDef.name);

  function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }
</script>

<Block>
  {#if widget.loading && !widget.data}
    <div class="space-y-2">
      <Skeleton class="h-4 w-20" />
    </div>
  {:else if widget.error}
    <div class="flex items-center gap-2 text-destructive text-sm">
      <IconAlertCircle class="h-4 w-4" />
      <span>{widget.error}</span>
    </div>
  {:else if widget.data}
    <Block layout="grid" columns={4}>
      <Cell label={$tw('labels.queries')}>{formatNumber(widget.data.queries)}</Cell>
      <Cell label={$tw('labels.blocked')}>{formatNumber(widget.data.blocked)}</Cell>
      <Cell label={$tw('labels.filtered')}>{widget.data.filtered}%</Cell>
      <Cell label={$tw('labels.latency')}>{widget.data.latency}ms</Cell>
    </Block>
  {/if}
</Block>