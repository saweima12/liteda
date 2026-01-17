<script lang="ts">
	import { browser } from '$app/environment';
	import type { GadgetProps } from '../types';
	import type { WeatherConfig, WeatherData } from './types';
	import { getWeatherInfo, getWeatherIcon, formatTemp, formatWindSpeed, getRelativeTime } from './utils';
	import * as Popover from '$components/ui/popover';
	import Row from '$lib/components/widget-ui/Row.svelte';
	
	// Icon imports using unplugin-icons
	import IconSun from '~icons/lucide/sun';
	import IconMoon from '~icons/lucide/moon';
	import IconCloud from '~icons/lucide/cloud';
	import IconCloudSun from '~icons/lucide/cloud-sun';
	import IconCloudMoon from '~icons/lucide/cloud-moon';
	import IconCloudFog from '~icons/lucide/cloud-fog';
	import IconCloudDrizzle from '~icons/lucide/cloud-drizzle';
	import IconCloudRain from '~icons/lucide/cloud-rain';
	import IconCloudSnow from '~icons/lucide/cloud-snow';
	import IconCloudLightning from '~icons/lucide/cloud-lightning';
	import IconHelpCircle from '~icons/lucide/help-circle';
	import IconLoader from '~icons/lucide/loader-circle';
	import IconAlertCircle from '~icons/lucide/alert-circle';

	interface Props extends GadgetProps<WeatherConfig> {}

	let { config, id }: Props = $props();

	// Extract vars with defaults
	const vars = $derived(config.vars);
	const latitude = $derived(vars.latitude);
	const longitude = $derived(vars.longitude);
	const label = $derived(vars.label);
	const units = $derived(vars.units || 'metric');
	const refresh = $derived(vars.refresh || 600000);
	const cache = $derived(vars.cache || 5);

	// State
	let data = $state<WeatherData | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let popoverOpen = $state(false);

	/**
	 * Fetch weather data from our API
	 * Only pass gadget ID - server will lookup vars from config
	 */
	async function fetchWeather() {
		try {
			const response = await fetch(`/api/gadgets/weather?id=${encodeURIComponent(id)}`);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || 'Failed to fetch weather');
			}

			data = await response.json();
			error = null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
			console.error('Failed to fetch weather:', e);
		} finally {
			loading = false;
		}
	}

	/**
	 * Auto-fetch weather data with interval
	 */
	$effect(() => {
		if (!browser) return;

		fetchWeather();
		const interval = setInterval(fetchWeather, refresh);
		return () => clearInterval(interval);
	});

	// Derived values
	const weatherInfo = $derived(data ? getWeatherInfo(data.weatherCode) : null);
	const iconName = $derived(data ? getWeatherIcon(data.weatherCode, data.isDay) : 'cloud');

	/**
	 * Map icon name to component
	 */
	function getIconComponent(name: string) {
		type IconComponent = typeof IconSun;
		const iconMap: Record<string, IconComponent> = {
			'sun': IconSun,
			'moon': IconMoon,
			'cloud': IconCloud,
			'cloud-sun': IconCloudSun,
			'cloud-moon': IconCloudMoon,
			'cloud-fog': IconCloudFog,
			'cloud-drizzle': IconCloudDrizzle,
			'cloud-rain': IconCloudRain,
			'cloud-snow': IconCloudSnow,
			'cloud-lightning': IconCloudLightning,
			'help-circle': IconHelpCircle,
		};
		return iconMap[name] || IconCloud;
	}

	const WeatherIcon = $derived(getIconComponent(iconName));
</script>

<Popover.Root bind:open={popoverOpen}>
	<Popover.Trigger
		class="inline-flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hover:text-foreground transition-colors"
	>
			{#if loading && !data}
				<IconLoader class="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-muted-foreground flex-shrink-0" />
				<span class="text-muted-foreground hidden sm:inline">Loading...</span>
			{:else if error}
				<IconAlertCircle class="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive flex-shrink-0" />
				<span class="text-destructive hidden sm:inline">Error</span>
			{:else if data}
				<WeatherIcon class="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
				<span class="font-medium">{formatTemp(data.temperature, units)}</span>
				{#if label}
					<span class="text-muted-foreground hidden md:inline">{label}</span>
				{/if}
			{/if}
	</Popover.Trigger>

	<Popover.Content class="w-72">
		{#if data && weatherInfo}
			<div class="space-y-3">
				<!-- Header: Icon + Weather description -->
				<div class="flex items-center gap-3">
					<WeatherIcon class="h-8 w-8" />
					<div class="flex-1">
						<div class="font-semibold text-base">{weatherInfo.text}</div>
						{#if label}
							<div class="text-xs text-muted-foreground">{label}</div>
						{/if}
					</div>
				</div>

				<!-- Details -->
				<div class="space-y-1.5">
					<Row label="Temperature" value={formatTemp(data.temperature, units)} />
					<Row label="Feels Like" value={formatTemp(data.feelsLike, units)} />
					<Row label="Humidity" value={`${data.humidity}%`} />
					<Row label="Wind Speed" value={formatWindSpeed(data.windSpeed, units)} />
				</div>

				<!-- Footer: Last update time -->
				<div class="text-xs text-muted-foreground border-t pt-2">
					Updated {getRelativeTime(data.updatedAt)}
				</div>
			</div>
		{:else if error}
			<div class="text-sm text-destructive">
				{error}
			</div>
		{:else}
			<div class="text-sm text-muted-foreground">
				Loading weather data...
			</div>
		{/if}
	</Popover.Content>
</Popover.Root>
