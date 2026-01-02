<script lang="ts">
  import type { ClientWidgetConfig } from '../types';
  import widgetDef from './meta';
  import { useWidget } from '../utils';
  import { Block, Cell } from '$components/widget-ui';
  import { Skeleton } from '$components/ui';
  import IconAlertCircle from '~icons/lucide/alert-circle';

  interface Props {
    config: ClientWidgetConfig;
  }

  let { config }: Props = $props();

  const widget = useWidget(widgetDef, () => config);
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
    <Block layout="grid" columns={3}>
      <Cell label="Enabled">{widget.data.enabled}</Cell>
      <Cell label="Disabled">{widget.data.disabled}</Cell>
      <Cell label="Total">{widget.data.total}</Cell>
    </Block>
  {/if}
</Block>