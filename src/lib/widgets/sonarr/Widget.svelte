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
		<div class="grid grid-cols-3 gap-2">
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
		<div class="grid grid-cols-3 gap-2">
			<Cell label="Wanted">{widget.data.wanted}</Cell>
			<Cell label="Queued">{widget.data.queued}</Cell>
			<Cell label="Series">{widget.data.series}</Cell>
		</div>
	{/if}
</Block>
