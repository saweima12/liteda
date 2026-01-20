<script lang="ts">
  import type { ClientWidgetConfig } from '../types';
  import widgetDef from './meta';
  import { useWidget } from '../utils';
  import { wt } from '../utils/i18n';
  import { Block, Cell } from '$components/widget-ui';
  import IconAlertCircle from '~icons/lucide/alert-circle';

  interface Props {
    config: ClientWidgetConfig;
  }

  let { config }: Props = $props();

  const widget = useWidget(widgetDef, () => config);
  const tw = wt(widgetDef.name);
</script>

<Block loading={widget.loading && !widget.data}>
  {#if widget.error}
    <div class="flex items-center gap-2 text-destructive text-sm">
      <IconAlertCircle class="h-4 w-4" />
      <span>{widget.error}</span>
    </div>
  {:else if widget.data}
    <Block layout="grid" columns={2}>
      <Cell label={$tw('labels.status')}>{widget.data.status}</Cell>
      <Cell label={$tw('labels.originIp')}>{widget.data.originIp ?? 'N/A'}</Cell>
    </Block>
  {/if}
</Block>