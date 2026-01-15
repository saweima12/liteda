<script lang="ts">
	import type { ClientWidgetConfig } from '../types';
	import widgetDef from './meta';
	import { useWidget } from '../utils';
	import { Block, Cell } from '$components/widget-ui';
	import { Skeleton } from '$components/ui';
	import IconAlertCircle from '~icons/lucide/alert-circle';
	import IconAlertTriangle from '~icons/lucide/alert-triangle';

	interface Props {
		config: ClientWidgetConfig;
	}

	let { config }: Props = $props();
	const widget = useWidget(widgetDef, () => config);
</script>

<Block>
	{#if widget.loading && !widget.data}
		<div class="grid grid-cols-4 gap-2">
			<Skeleton class="h-8" />
			<Skeleton class="h-8" />
			<Skeleton class="h-8" />
			<Skeleton class="h-8" />
		</div>
	{:else if widget.error}
		<div class="flex items-center gap-2 text-destructive text-sm">
			<IconAlertCircle class="h-4 w-4 shrink-0" />
			<span>{widget.error}</span>
		</div>
	{:else if widget.data}
		<div class="grid grid-cols-4 gap-2">
			<Cell label="Up"><span class="text-green-500">{widget.data.up}</span></Cell>
			<Cell label="Down"><span class="text-red-500">{widget.data.down}</span></Cell>
			<Cell label="Uptime">{widget.data.uptime}%</Cell>
			<Cell label="Incident">
				{#if widget.data.incident}
					<IconAlertTriangle class="h-4 w-4 text-yellow-500" />
				{:else}
					<span class="text-muted-foreground">-</span>
				{/if}
			</Cell>
		</div>
	{/if}
</Block>
