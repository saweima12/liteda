<script lang="ts">
  import type { ClientWidgetConfig } from '$lib/widgets/types';
  import { getWidgetComponent } from '$lib/widgets';
  import IconAlertCircle from '~icons/lucide/alert-circle';

  interface Props {
    config: ClientWidgetConfig;
  }

  let { config }: Props = $props();

  const WidgetComponent = $derived(getWidgetComponent(config.type));
</script>

{#if WidgetComponent}
  <WidgetComponent {config} />
{:else}
  <div class="flex items-center gap-2 text-sm text-muted-foreground">
    <IconAlertCircle class="h-4 w-4" />
    <span>Unknown widget: {config.type}</span>
  </div>
{/if}
