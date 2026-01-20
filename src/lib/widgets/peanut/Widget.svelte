<script lang="ts">
	import type { ClientWidgetConfig } from '../types';
	import widgetDef from './meta';
	import { useWidget } from '../utils';
	import { Block, Cell } from '$components/widget-ui';
	import IconAlertCircle from '~icons/lucide/alert-circle';
	import IconBattery from '~icons/lucide/battery';
	import IconBatteryCharging from '~icons/lucide/battery-charging';

	interface Props {
		config: ClientWidgetConfig;
	}

	let { config }: Props = $props();
	const widget = useWidget(widgetDef, () => config);

	function getBatteryClass(charge: number): string {
		if (charge > 50) return 'text-green-500';
		if (charge > 20) return 'text-yellow-500';
		return 'text-red-500';
	}

	function getLoadClass(load: number): string {
		if (load > 80) return 'text-red-500';
		if (load > 50) return 'text-yellow-500';
		return 'text-green-500';
	}
</script>

<Block loading={widget.loading && !widget.data}>
	{#if widget.error}
		<div class="flex items-center gap-2 text-destructive text-sm">
			<IconAlertCircle class="h-4 w-4 shrink-0" />
			<span>{widget.error}</span>
		</div>
	{:else if widget.data}
		<div class="grid grid-cols-3 gap-2">
			<Cell label="Battery">
				<span class={getBatteryClass(widget.data.batteryCharge)}>
					{widget.data.batteryCharge}%
				</span>
			</Cell>
			<Cell label="Load">
				<span class={getLoadClass(widget.data.load)}>
					{widget.data.load}%
				</span>
			</Cell>
			<Cell label="Status">
				<span class="text-xs" title={widget.data.status}>
					{widget.data.statusDescription}
				</span>
			</Cell>
		</div>
	{/if}
</Block>
