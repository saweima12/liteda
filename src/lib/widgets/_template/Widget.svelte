<!--
  Widget Template - Widget.svelte
  
  UI component for rendering widget data
-->
<script lang="ts">
  import type { ClientWidgetConfig } from '../types';
  import widgetDef from './meta';
  import { useWidget } from '../utils';
  import { Block, Row, Cell, Status, Metric, Progress } from '$components/widget-ui';
  import { Skeleton } from '$components/ui';
  import IconAlertCircle from '~icons/lucide/alert-circle';

  interface Props {
    config: ClientWidgetConfig;
  }

  let { config }: Props = $props();

  // Don't destructure - it breaks reactivity
  const widget = useWidget(widgetDef, () => config);
</script>

<Block>
  {#if widget.loading && !widget.data}
    <!-- Loading state -->
    <div class="space-y-2">
      <Skeleton class="h-4 w-24" />
      <Skeleton class="h-4 w-32" />
    </div>
  {:else if widget.error}
    <!-- Error state -->
    <div class="flex items-center gap-2 text-destructive text-sm">
      <IconAlertCircle class="h-4 w-4" />
      <span>{widget.error}</span>
    </div>
  {:else if widget.data}
    <!-- Normal state - use widget-ui components to render data -->
    
    <!-- Example: use Row for key-value display -->
    <!-- <Row label="Status" value={widget.data.status} /> -->
    
    <!-- Example: use Status for status indicator -->
    <!-- <Status status={widget.data.status === 'online' ? 'healthy' : 'error'} /> -->
    
    <!-- Example: use Metric for large numbers -->
    <!-- <Metric label="Value" value={widget.data.value} unit="%" /> -->
    
    <!-- Example: use Progress for progress bar -->
    <!-- <Progress label="Usage" value={widget.data.value} max={100} /> -->
    
    <!-- Example: use Grid layout -->
    <!-- <Block layout="grid" columns={2}>
      <Cell label="Label1">{widget.data.value1}</Cell>
      <Cell label="Label2">{widget.data.value2}</Cell>
    </Block> -->
    
    <Row label="Message" value="Widget is working!" />
  {/if}
</Block>
