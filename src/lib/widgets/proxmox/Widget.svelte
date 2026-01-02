<script lang="ts">
    import type { ClientWidgetConfig } from '../types';
    import widgetDef from './meta';
    import { useWidget } from '../utils';
    import { Block, Row, Cell, Progress } from '$components/widget-ui';
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
    <Skeleton class="h-4 w-32" />
    <Skeleton class="h-4 w-24" />
    </div>
{:else if widget.error}
    <div class="flex items-center gap-2 text-destructive text-sm">
    <IconAlertCircle class="h-4 w-4" />
    <span>{widget.error}</span>
    </div>
{:else if widget.data}
    <Block layout="grid" columns={4}>
    <Cell label="VMs">
        {widget.data.vms.running}/{widget.data.vms.total}
    </Cell>
    <Cell label="LXC">
        {widget.data.lxc.running}/{widget.data.lxc.total}
    </Cell>
    <Cell label="CPU">{widget.data.cpu}%</Cell>
    <Cell label="MEM">{widget.data.mem}%</Cell>
    </Block>
{/if}
</Block>