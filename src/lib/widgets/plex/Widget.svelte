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
		<div class="grid grid-cols-3 gap-2">
			<Cell label="Movies">{widget.data.movies}</Cell>
			<Cell label="Shows">{widget.data.shows}</Cell>
			<Cell label="Streams">{widget.data.streams}</Cell>
		</div>
	{/if}
</Block>

