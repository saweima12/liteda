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

	function formatSpeed(bytesPerSec: number): string {
		if (bytesPerSec < 1024) return `${bytesPerSec} B/s`;
		if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
		return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
	}
</script>

<Block loading={widget.loading && !widget.data}>
	{#if widget.error}
		<div class="flex items-center gap-2 text-destructive text-sm">
			<IconAlertCircle class="h-4 w-4 shrink-0" />
			<span>{widget.error}</span>
		</div>
	{:else if widget.data}
		<div class="grid grid-cols-4 gap-2">
			<Cell label="Down">{formatSpeed(widget.data.download)}</Cell>
			<Cell label="Up">{formatSpeed(widget.data.upload)}</Cell>
			<Cell label="Active">{widget.data.active}</Cell>
			<Cell label="Seeding">{widget.data.seeding}</Cell>
		</div>
	{/if}
</Block>
