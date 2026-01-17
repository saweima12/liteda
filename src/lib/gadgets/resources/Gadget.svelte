<script lang="ts">
	import { browser } from '$app/environment';
	import type { GadgetProps } from '../types';
	import type { ResourcesConfig, ResourcesData, ResourcesVars } from './types';
	import { GadgetItem, GadgetMetric, GadgetProgress, GadgetState } from '$lib/components/gadget-ui';
	import IconCpu from '~icons/lucide/cpu';
	import IconMemoryStick from '~icons/lucide/memory-stick';
	import IconHardDrive from '~icons/lucide/hard-drive';
	import IconThermometer from '~icons/lucide/thermometer';

	interface Props extends GadgetProps<ResourcesConfig> {}

	let { config, id }: Props = $props();

	// Extract vars with defaults
	const vars = $derived<Partial<ResourcesVars>>(config.vars ?? {});
	const showCpu = $derived(vars.cpu !== false);
	const showMemory = $derived(vars.memory !== false);
	const showDisk = $derived(vars.disk !== undefined);
	const showTemp = $derived(vars.cputemp === true);
	const refreshInterval = $derived(vars.refresh ?? 5000);
	const showGraph = $derived(vars.showGraph !== false);
	const tempWarn = $derived(vars.tempWarn ?? 80);
	const tempUnit = $derived(vars.tempUnit ?? 'celsius');

	// Resource data state
	let data = $state<ResourcesData | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	/**
	 * Fetch resources data from our API
	 * Only pass gadget ID - server will lookup vars from config
	 */
	async function fetchResources() {
		try {
			const res = await fetch(`/api/gadgets/resources?id=${encodeURIComponent(id)}`);

			if (!res.ok) throw new Error('Failed to fetch resources');
			data = await res.json();
			error = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}

	// Auto-fetch with interval (client-side only)
	$effect(() => {
		if (!browser) return;

		fetchResources();
		const id = setInterval(fetchResources, refreshInterval);
		return () => clearInterval(id);
	});

	// Format bytes to human readable
	function formatBytes(bytes: number, decimals = 1): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
	}

	// Format temperature
	function formatTemp(celsius: number | null): string {
		if (celsius === null) return 'N/A';
		if (tempUnit === 'fahrenheit') {
			return `${((celsius * 9) / 5 + 32).toFixed(1)}°F`;
		}
		return `${celsius.toFixed(1)}°C`;
	}

	// Check if temperature is warning level
	function isTempWarning(temp: number | null): boolean {
		return temp !== null && temp >= tempWarn;
	}
</script>

<GadgetState {loading} {error} />

{#if data}
	<!-- Always use flex layout with wrap, centered, distributed spacing -->
	<div class="flex flex-wrap items-center justify-center w-full gap-4 md:gap-3 text-sm">
		<!-- CPU -->
		{#if showCpu && data.cpu}
			<GadgetItem icon={IconCpu} iconClass="text-muted-foreground">
				<GadgetMetric
					value={`${data.cpu.usage}%`}
					label="CPU"
					secondary={`${data.cpu.load ? data.cpu.load : 'N/A'} Load`}
				/>
				{#if showGraph}
					<GadgetProgress value={data.cpu.usage} />
				{/if}
			</GadgetItem>
		{/if}

		<!-- Memory -->
		{#if showMemory && data.memory}
			<GadgetItem icon={IconMemoryStick} iconClass="text-muted-foreground">
				<GadgetMetric
					value={formatBytes(data.memory.used)}
					label="Used"
					secondary={`${formatBytes(data.memory.total)} Total`}
				/>	
				{#if showGraph}
					<GadgetProgress value={data.memory.usedPercent} />
				{/if}
			</GadgetItem>
		{/if}

		<!-- Disk -->
		{#if showDisk && data.disk}
			<GadgetItem icon={IconHardDrive} iconClass="text-muted-foreground">
				<GadgetMetric
					value={formatBytes(data.disk.free)}
					label="Free"
					secondary="{formatBytes(data.disk.total)} Total"
				/>
				{#if showGraph}
					<GadgetProgress value={data.disk.usedPercent} />
				{/if}
			</GadgetItem>
		{/if}

		<!-- Temperature -->
		{#if showTemp && data.temperature}
			{@const isWarning = isTempWarning(data.temperature.main)}
			<GadgetItem
				icon={IconThermometer}
				iconClass={isWarning ? 'text-destructive' : 'text-muted-foreground'}
			>
				<GadgetMetric
					value={data.temperature.main !== null ? formatTemp(data.temperature.main) : 'N/A'}
					label="TEMP"
					secondary="{data.temperature.max !== null ? formatTemp(data.temperature.max) : 'N/A'} Max"
					highlight={isWarning}
				/>
				{#if showGraph}
					<GadgetProgress
						value={data.temperature.main !== null ? Math.min((data.temperature.main / 100) * 100, 100) : 0}
						highlight={isWarning}
					/>
				{/if}
			</GadgetItem>
		{/if}
	</div>
{/if}
