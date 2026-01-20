<!--
  Widget Template - Widget.svelte

  UI component for rendering widget data
-->
<script lang="ts">
  import type { ClientWidgetConfig } from '../types';
  import widgetDef from './meta';
  import { useWidget } from '../utils';
  import { wt } from '../utils/i18n';
  import { Block, Row, Cell, Status, Metric, Progress } from '$components/widget-ui';
  import IconAlertCircle from '~icons/lucide/alert-circle';

  interface Props {
    config: ClientWidgetConfig;
  }

  let { config }: Props = $props();

  // Don't destructure - it breaks reactivity
  const widget = useWidget(widgetDef, () => config);

  // Create translation function for this widget
  const tw = wt(widgetDef.name);
</script>

<Block loading={widget.loading && !widget.data}>
  {#if widget.error}
    <!-- Error state -->
    <div class="flex items-center gap-2 text-destructive text-sm">
      <IconAlertCircle class="h-4 w-4" />
      <span>{widget.error}</span>
    </div>
  {:else if widget.data}
    <!-- Normal state - use widget-ui components to render data -->
    
    <!-- Example: use Row for key-value display -->
    <!-- <Row label="Status" value={widget.data.status} loading={widget.loading} /> -->
    
    <!-- Example: use Status for status indicator -->
    <!-- <Status status={widget.data.status === 'online' ? 'healthy' : 'error'} loading={widget.loading} /> -->
    
    <!-- Example: use Metric for large numbers -->
    <!-- <Metric label="Value" value={widget.data.value} unit="%" loading={widget.loading} /> -->
    
    <!-- Example: use Progress for progress bar -->
    <!-- <Progress label="Usage" value={widget.data.value} max={100} loading={widget.loading} /> -->
    
    <!-- Example: use Grid layout with i18n -->
    <!-- <Block layout="grid" columns={2} loading={widget.loading}>
      <Cell label={$tw('labels.label1')} loading={widget.loading}>{widget.data.value1}</Cell>
      <Cell label={$tw('labels.label2')} loading={widget.loading}>{widget.data.value2}</Cell>
    </Block> -->

    <!-- Remember to add translations to:
         - src/lib/i18n/translations/en/widgets.json
         - src/lib/i18n/translations/zh/widgets.json
    -->

    <Row label="Message" value="Widget is working!" />
  {/if}
</Block>
