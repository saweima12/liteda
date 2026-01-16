import { createGadgetHandler } from '$lib/gadgets/utils/create-handler';
import { weatherVarsSchema, type WeatherData, type OpenMeteoResponse } from './types';

/**
 * Fetch weather data from Open-Meteo API
 */
async function fetchOpenMeteo(latitude: number, longitude: number): Promise<OpenMeteoResponse> {
	const url = new URL('https://api.open-meteo.com/v1/forecast');
	url.searchParams.set('latitude', latitude.toString());
	url.searchParams.set('longitude', longitude.toString());
	url.searchParams.set(
		'current',
		[
			'temperature_2m',
			'relative_humidity_2m',
			'apparent_temperature',
			'weather_code',
			'wind_speed_10m',
			'is_day',
		].join(',')
	);
	url.searchParams.set('timezone', 'auto');

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

	try {
		const response = await fetch(url.toString(), {
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new Error(`Open-Meteo API error: ${response.status}`);
		}

		return await response.json();
	} finally {
		clearTimeout(timeoutId);
	}
}

/**
 * GET /api/gadgets/weather?id=<gadget-id>
 * Query parameter:
 *   - id: string (gadget instance ID)
 *
 * Server-side vars (from settings.yaml):
 *   - latitude: number (required)
 *   - longitude: number (required)
 *   - label: string (optional)
 *   - cache: number (optional, cache TTL in minutes, default 5)
 */
export const GET = createGadgetHandler({
	varsSchema: weatherVarsSchema,
	async fetch(vars) {
		// Fetch from Open-Meteo
		const response = await fetchOpenMeteo(vars.latitude, vars.longitude);

		// Transform to our format
		return {
			temperature: response.current.temperature_2m,
			feelsLike: response.current.apparent_temperature,
			humidity: response.current.relative_humidity_2m,
			windSpeed: response.current.wind_speed_10m,
			weatherCode: response.current.weather_code,
			isDay: response.current.is_day === 1,
			label: vars.label,
			updatedAt: new Date().toISOString(),
		} satisfies WeatherData;
	},
	cacheTtl: (vars) => (vars.cache ?? 5) * 60 * 1000, // Convert minutes to milliseconds
	getCacheKey: (vars) =>
		`weather:${vars.latitude.toFixed(4)},${vars.longitude.toFixed(4)}`,
});
