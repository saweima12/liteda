<script lang="ts">
	import type { ClientWidgetConfig } from '../types';
	import widgetDef from './meta';
	import { useWidget } from '../utils';
	import { Block, Cell } from '$components/widget-ui';
	import IconAlertCircle from '~icons/lucide/alert-circle';

	interface Props {
		config: ClientWidgetConfig;
	}

	let { config }: Props = $props();
	const widget = useWidget(widgetDef, () => config);
</script>

<Block loading={widget.loading && !widget.data}>
	{#if widget.error}
		<div class="flex items-center gap-2 text-destructive text-sm">
			<IconAlertCircle class="h-4 w-4 shrink-0" />
			<span>{widget.error}</span>
		</div>
	{:else if widget.data}
		<div class="grid grid-cols-4 gap-2">
			<Cell label="Repositories">{widget.data.repositories}</Cell>
			<Cell label="Stars">{widget.data.stars}</Cell>
			<Cell label="Forks">{widget.data.forks}</Cell>
			<Cell label="Issues">
				{#if widget.data.issues > 0}
					<span class="text-yellow-500">{widget.data.issues}</span>
				{:else}
					{widget.data.issues}
				{/if}
			</Cell>
		</div>
	{/if}
</Block>
