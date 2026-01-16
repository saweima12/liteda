<script lang="ts">
	import { browser } from '$app/environment';
	import type { AddonProps } from '../types';
	import type { ResourcesConfig, ResourcesData, ResourcesVars } from './types';
	import IconCpu from '~icons/lucide/cpu';
	import IconMemoryStick from '~icons/lucide/memory-stick';
	import IconHardDrive from '~icons/lucide/hard-drive';
	import IconThermometer from '~icons/lucide/thermometer';

	interface Props extends AddonProps<ResourcesConfig> {}

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
	 * Only pass addon ID - server will lookup vars from config
	 */
	async function fetchResources() {
		try {
			const res = await fetch(`/api/addons/resources?id=${encodeURIComponent(id)}`);

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

<div class="flex items-center gap-4 text-sm">
	{#if loading && !data}
		<span class="text-muted-foreground">Loading...</span>
	{:else if error}
		<span class="text-destructive">{error}</span>
	{:else if data}
		<!-- CPU -->
		{#if showCpu && data.cpu}
			<div class="flex items-center gap-2">
				<IconCpu class="h-4 w-4 text-muted-foreground" />
				<div class="flex flex-col min-w-[60px]">
					<div class="flex items-baseline gap-1">
						<span class="font-medium">{data.cpu.usage}%</span>
						<span class="text-xs text-muted-foreground">CPU</span>
					</div>
					{#if showGraph}
						<div class="h-1 w-full bg-muted rounded-full overflow-hidden">
							<div
								class="h-full bg-primary transition-all duration-300"
								style="width: {data.cpu.usage}%"
							></div>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Memory -->
		{#if showMemory && data.memory}
			<div class="flex items-center gap-2">
				<IconMemoryStick class="h-4 w-4 text-muted-foreground" />
				<div class="flex flex-col min-w-[80px]">
					<div class="flex items-baseline gap-1">
						<span class="font-medium">{formatBytes(data.memory.free)}</span>
						<span class="text-xs text-muted-foreground">Free</span>
					</div>
					<div class="flex items-center gap-1">
						{#if showGraph}
							<div class="h-1 flex-1 bg-muted rounded-full overflow-hidden">
								<div
									class="h-full bg-primary transition-all duration-300"
									style="width: {data.memory.usedPercent}%"
								></div>
							</div>
						{/if}
						<span class="text-xs text-muted-foreground">{formatBytes(data.memory.total)}</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- Disk -->
		{#if showDisk && data.disk}
			<div class="flex items-center gap-2">
				<IconHardDrive class="h-4 w-4 text-muted-foreground" />
				<div class="flex flex-col min-w-[80px]">
					<div class="flex items-baseline gap-1">
						<span class="font-medium">{formatBytes(data.disk.free)}</span>
						<span class="text-xs text-muted-foreground">Free</span>
					</div>
					<div class="flex items-center gap-1">
						{#if showGraph}
							<div class="h-1 flex-1 bg-muted rounded-full overflow-hidden">
								<div
									class="h-full bg-primary transition-all duration-300"
									style="width: {data.disk.usedPercent}%"
								></div>
							</div>
						{/if}
						<span class="text-xs text-muted-foreground">{formatBytes(data.disk.total)}</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- Temperature -->
		{#if showTemp && data.temperature}
			<div class="flex items-center gap-2">
				<IconThermometer
					class="h-4 w-4 {isTempWarning(data.temperature.main)
						? 'text-destructive'
						: 'text-muted-foreground'}"
				/>
				<div class="flex flex-col min-w-[60px]">
					<div class="flex items-baseline gap-1">
						<span
							class="font-medium {isTempWarning(data.temperature.main) ? 'text-destructive' : ''}"
						>
							{formatTemp(data.temperature.main)}
						</span>
						<span class="text-xs text-muted-foreground">TEMP</span>
					</div>
					{#if data.temperature.max !== null && showGraph}
						<div class="flex items-center gap-1">
							<div class="h-1 flex-1 bg-muted rounded-full overflow-hidden">
								<div
									class="h-full transition-all duration-300 {isTempWarning(data.temperature.main)
										? 'bg-destructive'
										: 'bg-primary'}"
									style="width: {data.temperature.main !== null
										? Math.min((data.temperature.main / 100) * 100, 100)
										: 0}%"
								></div>
							</div>
							<span class="text-xs text-muted-foreground">{formatTemp(data.temperature.max)}</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>
